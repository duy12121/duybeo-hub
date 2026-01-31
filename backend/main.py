from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from bson import ObjectId
import asyncio

from config import settings
from database import connect_to_mongo, close_mongo_connection, get_database
from models import (
    User, UserCreate, UserUpdate, Token, BotStatus, BotCommand, 
    BotConfig, LogEntry, DashboardStats, Permission, UserRole, ROLE_PERMISSIONS,
    UserBreakdown, ActivityPoint
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_active_user, check_permission
)
from websocket_manager import manager
from contextlib import asynccontextmanager

import os
import json
import asyncio
import bot_runner 
import re

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    
    # Bot không được khởi động tự động, phải start từ web
    # if settings.auto_start_bot.lower() == "true":
    #     try:
    #         print("🤖 Đang nạp cấu hình Bot từ settings...")
    #         cookies = json.loads(settings.zalo_cookies)
    #         
    #         bot_runner.initialize_bot(
    #             settings.zalo_api_key, 
    #             settings.zalo_secret_key, 
    #             settings.zalo_imei, 
    #             cookies
    #         )
    #         
    #         await asyncio.sleep(0.5)
    #
    #         asyncio.create_task(asyncio.to_thread(bot_runner.start_bot_background))
    #         
    #         bot_state["is_running"] = True
    #         print("✅ Zalo Bot đã được ra lệnh chạy ngầm...")
    #     except Exception as e:
    #         print(f"❌ Lỗi khởi động Bot: {e}")

    db = await get_database()
    admin_exists = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if not admin_exists:
        default_admin = {
            "_id": ObjectId(),
            "username": "admin",
            "email": "admin@zalobot.local",
            "full_name": "Super Admin",
            "hashed_password": get_password_hash("admin123"),
            "role": UserRole.SUPER_ADMIN,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(default_admin)
        print("✅ Default super admin created: admin/admin123")
    
    yield 

    await close_mongo_connection()

app = FastAPI(title="Zalo Bot Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/check-username")
async def check_username(username: str):
    """Check if username is available"""
    db = await get_database()
    uname = username.strip().lower()
    existing = await db.users.find_one({"username": {"$regex": f"^{re.escape(uname)}$", "$options": "i"}})
    return {"available": existing is None}

@app.post("/api/auth/check-email")
async def check_email(email: str):
    """Check if email is available"""
    db = await get_database()
    if not email:
        return {"available": True}
    em = email.strip().lower()
    existing = await db.users.find_one({"email": {"$regex": f"^{re.escape(em)}$", "$options": "i"}})
    return {"available": existing is None}

class RegisterResponse(BaseModel):
    user: User
    access_token: str
    token_type: str = "bearer"

@app.post("/api/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user account and return token for auto-login"""
    db = await get_database()
    
    # Normalize and check if username already exists
    uname = user_data.username.strip().lower()
    existing_user = await db.users.find_one({"username": {"$regex": f"^{re.escape(uname)}$", "$options": "i"}})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username_exists"
        )

    # Normalize and check if email already exists (only if provided)
    em = None
    if user_data.email:
        em = user_data.email.strip().lower()
        existing_email = await db.users.find_one({"email": {"$regex": f"^{re.escape(em)}$", "$options": "i"}})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="email_exists"
            )

    # Create new user with 'viewer' role (lowest privilege)
    now = datetime.now(timezone.utc)
    user_dict = {
        "username": uname,
        "full_name": user_data.full_name or user_data.username,
        "hashed_password": get_password_hash(user_data.password),
        "role": "viewer",  # Default role for new users
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    if em:
        user_dict["email"] = em
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    # Get permissions for the user role
    permissions = ROLE_PERMISSIONS.get("viewer", [])
    
    user = User(
        id=user_dict["id"],
        username=user_dict["username"],
        email=user_dict.get("email"),
        full_name=user_dict["full_name"],
        role=user_dict["role"],
        is_active=user_dict["is_active"],
        created_at=user_dict["created_at"],
        permissions=permissions
    )
    
    # Create access token for auto-login
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": uname}, expires_delta=access_token_expires
    )
    
    return RegisterResponse(user=user, access_token=access_token)

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/api/users", response_model=List[User])
async def list_users(
    current_user: User = Depends(check_permission(Permission.VIEW_USERS))
):
    db = await get_database()
    users = []
    async for user_dict in db.users.find():
        permissions = ROLE_PERMISSIONS.get(user_dict["role"], [])
        users.append(User(
            id=str(user_dict["_id"]),
            username=user_dict["username"],
            email=user_dict.get("email"),
            full_name=user_dict.get("full_name"),
            role=user_dict["role"],
            is_active=user_dict["is_active"],
            created_at=user_dict["created_at"],
            permissions=permissions
        ))
    return users

@app.post("/api/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    current_user: User = Depends(check_permission(Permission.CREATE_USERS))
):
    db = await get_database()

    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    # only check email collision if an email was provided
    if user.email:
        existing_email = await db.users.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    user_dict = {
        "_id": ObjectId(),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": get_password_hash(user.password),
        "role": user.role,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    permissions = ROLE_PERMISSIONS.get(user.role, [])
    return User(
        id=str(user_dict["_id"]),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=True,
        created_at=user_dict["created_at"],
        permissions=permissions
    )

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(check_permission(Permission.MANAGE_USERS))
):
    db = await get_database()
    
    update_dict = {}
    if user_update.email:
        update_dict["email"] = user_update.email
    if user_update.full_name:
        update_dict["full_name"] = user_update.full_name
    if user_update.role:
        update_dict["role"] = user_update.role
    if user_update.password:
        update_dict["hashed_password"] = get_password_hash(user_update.password)
    if user_update.is_active is not None:
        update_dict["is_active"] = user_update.is_active
    
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    permissions = ROLE_PERMISSIONS.get(updated_user["role"], [])
    
    return User(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user["email"],
        full_name=updated_user.get("full_name"),
        role=updated_user["role"],
        is_active=updated_user["is_active"],
        created_at=updated_user["created_at"],
        permissions=permissions
    )

@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(check_permission(Permission.MANAGE_USERS))
):
    db = await get_database()

    user_to_delete = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_to_delete and user_to_delete["role"] == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# Global settings
logging_enabled = True  # Toggle to control log broadcasting

# Lock to prevent simultaneous bot starts
bot_start_lock = asyncio.Lock()

# Global settings
logging_enabled = True  # Toggle to control log broadcasting

bot_state = {
    "is_running": False,
    "start_time": None,
    "uptime": 0,
    "total_messages_sent": 0,
    "total_messages_received": 0,
    "active_users": 0,
    "last_activity": None,
    "config": {
        "auto_reply": True,
        "log_messages": True,
        "forward_to_admin": False,
        "custom_settings": {}
    },
    "activity_history": {}  # Stores message counts by hour: {"HH:00": count}
}

@app.get("/api/settings/logging")
async def get_logging_status(
    current_user: User = Depends(check_permission(Permission.VIEW_BOT_STATUS))
):
    """Get current logging status"""
    return {"enabled": logging_enabled}

@app.post("/api/settings/logging")
async def toggle_logging(
    enabled: bool,
    current_user: User = Depends(check_permission(Permission.CONFIGURE_BOT))
):
    """Toggle logging broadcasts"""
    global logging_enabled
    logging_enabled = enabled
    status = "enabled" if enabled else "disabled"
    if logging_enabled:  # only broadcast if logging is now enabled
        await manager.broadcast_log("INFO", f"Log broadcasting {status} by {current_user.username}")
    return {"enabled": logging_enabled, "message": f"Logging {status}"}

@app.get("/api/bot/status", response_model=BotStatus)
async def get_bot_status(
    current_user: User = Depends(check_permission(Permission.VIEW_BOT_STATUS))
):
    return BotStatus(**bot_state)

@app.post("/api/bot/start")
async def start_bot(
    current_user: User = Depends(check_permission(Permission.CONTROL_BOT)) 
):
    global bot_start_lock
    async with bot_start_lock:
        if bot_state["is_running"]:
            return {"message": "Bot is already running", "status": bot_state}
        
        try:
            cookies = json.loads(settings.zalo_cookies)
            bot_runner.initialize_bot(
                settings.zalo_api_key, 
                settings.zalo_secret_key, 
                settings.zalo_imei, 
                cookies
            )
            
            asyncio.create_task(asyncio.to_thread(bot_runner.start_bot_background))
            
            bot_state["is_running"] = True
            bot_state["start_time"] = datetime.now(timezone.utc).isoformat()
            bot_state["last_activity"] = datetime.now(timezone.utc).isoformat()
            
            await manager.broadcast_bot_status(bot_state)
            await manager.broadcast_log("INFO", f"Bot đã được khởi động bởi {current_user.username}")
            
            return {"message": "Bot started successfully", "status": bot_state}
        except Exception as e:
            error_msg = str(e)
            print(f"Error starting bot: {error_msg}")
            await manager.broadcast_log("ERROR", f"Lỗi khởi động: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/bot/stop")
async def stop_bot(
    current_user: User = Depends(check_permission(Permission.CONTROL_BOT))
):
    bot_state["is_running"] = False
    bot_state["start_time"] = None
    await manager.broadcast_bot_status(bot_state)
    await manager.broadcast_log("INFO", f"Bot stopped by {current_user.username}")
    
    # Clear logs when bot stops
    db = await get_database()
    await db.logs.delete_many({})
    
    return {"message": "Bot stopped successfully", "status": bot_state}

@app.post("/api/bot/restart")
async def restart_bot(
    current_user: User = Depends(check_permission(Permission.CONTROL_BOT))
):
    bot_state["is_running"] = False
    bot_state["start_time"] = None
    await manager.broadcast_log("INFO", f"Bot restarting by {current_user.username}...")
    
    # Clear logs when bot restarts
    db = await get_database()
    await db.logs.delete_many({})
    
    await asyncio.sleep(1)
    bot_state["is_running"] = True
    bot_state["start_time"] = datetime.now(timezone.utc).isoformat()
    bot_state["last_activity"] = datetime.now(timezone.utc).isoformat()
    await manager.broadcast_bot_status(bot_state)
    await manager.broadcast_log("INFO", "Bot restarted successfully")
    return {"message": "Bot restarted successfully", "status": bot_state}

@app.get("/api/bot/config", response_model=BotConfig)
async def get_bot_config(
    current_user: User = Depends(check_permission(Permission.VIEW_BOT_STATUS))
):
    return BotConfig(**bot_state["config"])

@app.put("/api/bot/config", response_model=BotConfig)
async def update_bot_config(
    config: BotConfig,
    current_user: User = Depends(check_permission(Permission.CONFIGURE_BOT))
):
    bot_state["config"] = config.dict()
    await manager.broadcast_log("INFO", f"Bot config updated by {current_user.username}")
    return config

@app.get("/api/logs", response_model=List[LogEntry])
async def get_logs(
    limit: int = 100,
    level: Optional[str] = None,
    current_user: User = Depends(check_permission(Permission.VIEW_LOGS))
):
    db = await get_database()
    query = {}
    if level:
        query["level"] = level
    
    logs = []
    async for log in db.logs.find(query).sort("timestamp", -1).limit(limit):
        logs.append(LogEntry(
            id=str(log["_id"]),
            timestamp=log["timestamp"],
            level=log["level"],
            message=log["message"],
            details=log.get("details")
        ))
    return logs

@app.post("/api/logs")
async def create_log(log: dict):
    """Endpoint for bot to send logs (protected by API key)"""
    db = await get_database()
    log_entry = {
        "_id": ObjectId(),
        "timestamp": datetime.utcnow(),
        "level": log.get("level", "INFO"),
        "message": log.get("message", ""),
        "details": log.get("details", {})
    }
    await db.logs.insert_one(log_entry)

    await manager.broadcast_log(
        log_entry["level"],
        log_entry["message"],
        log_entry["details"]
    )
    
    return {"message": "Log created successfully"}

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user)
):
    db = await get_database()
    
    total_users = await db.users.count_documents({})
    
    # Get user breakdown by role
    user_breakdown = UserBreakdown(
        super_admin=await db.users.count_documents({"role": "super_admin"}),
        admin=await db.users.count_documents({"role": "admin"}),
        moderator=await db.users.count_documents({"role": "moderator"}),
        viewer=await db.users.count_documents({"role": "viewer"})
    )

    # Calculate uptime if bot is running
    uptime_seconds = 0
    if bot_state["is_running"] and bot_state.get("start_time"):
        uptime_seconds = int((datetime.now(timezone.utc) - datetime.fromisoformat(bot_state["start_time"])).total_seconds())

    recent_logs = []
    async for log in db.logs.find().sort("timestamp", -1).limit(5):
        recent_logs.append(LogEntry(
            id=str(log["_id"]),
            timestamp=log["timestamp"],
            level=log["level"],
            message=log["message"],
            details=log.get("details")
        ))
    
    # Build activity data for the chart (last 6 time slots)
    activity_data = []
    activity_history = bot_state.get("activity_history", {})
    
    # Generate time slots for the last 6 hours or since bot started
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        hour_time = now - timedelta(hours=i)
        time_key = hour_time.strftime("%H:00")
        messages = activity_history.get(time_key, 0)
        activity_data.append(ActivityPoint(time=time_key, messages=messages))
    
    stats = DashboardStats(
        total_users=total_users,
        bot_uptime=uptime_seconds,
        messages_today=bot_state["total_messages_sent"],
        active_commands=0,
        recent_logs=recent_logs,
        user_breakdown=user_breakdown,
        activity_data=activity_data
    )
    
    # Broadcast stats to all connected clients (only if logging is enabled)
    if logging_enabled:
        await manager.broadcast_dashboard_stats(stats)
    
    return stats

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

if __name__ == "__main__":
    import uvicorn
    import logging
    
    # Suppress uvicorn/Starlette INFO logs to reduce spam
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("starlette").setLevel(logging.WARNING)
    
    # Disable access logs and reduce connection close spam
    uvicorn.run(app, host="0.0.0.0", port=8000, access_log=False, log_level="warning")