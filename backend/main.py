#    ---==Đức Phật ngồi dưới cây Âm Dương==---
#                         
#
#       69696969                         69696969
#    6969    696969                   696969    6969
#  969    69  6969696               6969  6969     696
# 969        696969696             696969696969     696
#969        69696969696           6969696969696      696
#696      9696969696969           969696969696       969
# 696     696969696969             969696969        969
#  696     696  96969      _=_      9696969  69    696
#    9696    969696      q(-_-)p      696969    6969
#       96969696         '_) (_`         69696969
#          96            /__/  \            69
#          69          _(<_   / )_          96
#         6969        (__\_\_|_/__)        9696
#       ========================================
#         a di đà phật, mong rằng không có BUG
#       ========================================
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import logging
import time
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from bson import ObjectId

from config import settings
from database import connect_to_mongo, close_mongo_connection, get_database
from models import (
    User, UserCreate, UserUpdate, Token, BotStatus, BotCommand, 
    BotConfig, LogEntry, DashboardStats, Permission, UserRole, ROLE_PERMISSIONS,
    UserBreakdown, ActivityPoint, CommandLog, UserProfile
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
import time

logger = logging.getLogger(__name__)

def _json_safe(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    if isinstance(value, tuple):
        return [_json_safe(v) for v in value]
    return value

try:
    from gemini_client import generate_content as generate_ai_content, get_api_key_status, reset_failed_keys
except Exception:
    generate_ai_content = None
    get_api_key_status = None
    reset_failed_keys = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Zalo Bot Manager API...")
    
    # Skip database initialization for now
    print("⚠️  Database initialization skipped - Configure MONGO_URI to enable")
    
    # Start auto cleanup task (will fail gracefully without DB)
    cleanup_task = None
    try:
        cleanup_task = asyncio.create_task(auto_cleanup_chat_sessions())
        print("✅ Auto cleanup task started")
    except Exception as e:
        print(f"⚠️  Cleanup task failed: {e}")
    
    print("✅ Application startup complete")
    
    yield
    
    # Cleanup task on shutdown
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
    
    print("🛑 Application shutdown complete")

app = FastAPI(title="Zalo Bot Manager API", version="1.0.0", lifespan=lifespan)

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

def _detect_frontend_dist_dir() -> Path:
    override = os.environ.get("FRONTEND_DIST_PATH")
    if override:
        return Path(override)

    candidates = [
        PROJECT_ROOT / "frontend" / "dist",
        BACKEND_DIR / ".." / "frontend" / "dist",
        Path.cwd() / "frontend" / "dist",
        Path.cwd() / "dist",
    ]

    for c in candidates:
        try:
            c = c.resolve()
            if (c / "index.html").exists():
                return c
        except Exception:
            continue

    return (PROJECT_ROOT / "frontend" / "dist").resolve()


FRONTEND_DIST_DIR = _detect_frontend_dist_dir()
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"

ENABLE_DEBUG_ENDPOINTS = os.environ.get("ENABLE_DEBUG_ENDPOINTS") == "1"

@app.get("/health")
@app.head("/health")
async def health_check_root():
    """Health check endpoint for deployment monitoring (root path)"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/health")
@app.head("/api/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

# Serve static files (frontend) - with fallback
try:
    print(f"[frontend] backend_dir={BACKEND_DIR}")
    print(f"[frontend] project_root={PROJECT_ROOT}")
    print(f"[frontend] cwd={Path.cwd()}")
    print(f"[frontend] dist_dir={FRONTEND_DIST_DIR}")
    print(f"[frontend] index_file={FRONTEND_INDEX_FILE}")
    print(f"[frontend] dist_exists={FRONTEND_DIST_DIR.exists()}")
    print(f"[frontend] index_exists={FRONTEND_INDEX_FILE.exists()}")

    if not FRONTEND_INDEX_FILE.exists():
        raise FileNotFoundError(f"Missing frontend build: {FRONTEND_INDEX_FILE}")

    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    FRONTEND_AVAILABLE = True
    print("✅ Frontend build detected and static assets mounted")
except Exception as e:
    FRONTEND_AVAILABLE = False
    print(f"⚠️  Frontend static files not found: {e}")

if ENABLE_DEBUG_ENDPOINTS:
    @app.get("/api/debug/frontend", include_in_schema=False)
    async def debug_frontend_files():
        def _safe_listdir(p: Path, limit: int = 50):
            try:
                if not p.exists() or not p.is_dir():
                    return []
                items = sorted([x.name for x in p.iterdir()])
                return items[:limit]
            except Exception:
                return []

        assets_dir = FRONTEND_DIST_DIR / "assets"
        return {
            "cwd": str(Path.cwd()),
            "backend_dir": str(BACKEND_DIR),
            "project_root": str(PROJECT_ROOT),
            "dist_dir": str(FRONTEND_DIST_DIR),
            "dist_exists": FRONTEND_DIST_DIR.exists(),
            "index_file": str(FRONTEND_INDEX_FILE),
            "index_exists": FRONTEND_INDEX_FILE.exists(),
            "assets_dir": str(assets_dir),
            "assets_exists": assets_dir.exists(),
            "dist_list": _safe_listdir(FRONTEND_DIST_DIR),
            "assets_list": _safe_listdir(assets_dir),
        }

@app.get("/")
async def read_index():
    """Serve the frontend index.html or fallback"""
    if FRONTEND_AVAILABLE:
        try:
            return FileResponse(str(FRONTEND_INDEX_FILE))
        except Exception as e:
            print(f"⚠️  Frontend file not found: {e}")
    
    # Fallback response
    return {
        "message": "Zalo Bot Manager API",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "api_docs": "/docs",
            "api_health": "/api/health"
        },
        "note": "Frontend build files not found. Please build the frontend first."
    }

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
    print(f"[DEBUG] Register attempt: {user_data.username}")
    try:
        db = await get_database()
        print(f"[DEBUG] Database connected successfully")
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )
    
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
    from datetime import timedelta
    gmt7 = timezone(timedelta(hours=7))
    now = datetime.now(gmt7)
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
    
    try:
        result = await db.users.insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        print(f"[SUCCESS] User saved successfully: {uname}")
    except Exception as e:
        print(f"[ERROR] Failed to save user to database: {e}")
        print(f"[ERROR] User data: {user_dict}")
        # Check if it's a duplicate key error
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save user. Please try again."
        )
    
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
    
    # Get current user data before update
    current_user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not current_user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {}
    if user_update.email:
        update_dict["email"] = user_update.email
    if user_update.full_name:
        update_dict["full_name"] = user_update.full_name
    if user_update.role:
        old_role = current_user_data.get("role")
        new_role = user_update.role
        update_dict["role"] = new_role
        
        # Send notification if role changed
        if old_role and old_role != new_role:
            role_names = {
                "super_admin": "Super Admin",
                "admin": "Admin", 
                "moderator": "Moderator",
                "viewer": "Viewer"
            }
            role_name = role_names.get(new_role, new_role)
            await manager.broadcast_log("INFO", f"Bạn vừa được duybeo cấp {role_name}")
            await manager.broadcast({
                "type": "role_update",
                "user_id": user_id,
                "username": current_user_data.get("username", "Unknown"),
                "old_role": old_role,
                "new_role": new_role,
                "role_name": role_name,
                "message": f"Bạn vừa được duybeo cấp {role_name}"
            })
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
        email=updated_user.get("email"),
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


# Logging: when ON, logs are stored, broadcast to WS, and printed to Render console
logging_enabled = True

bot_start_lock = asyncio.Lock()

bot_state = {
    "is_running": False,
    "start_time": None,
    "uptime": 0,
    "total_messages_sent": 0,
    "total_messages_received": 0,
    "messages_today": 0,
    "activity_date": None,
    "active_commands": 0,
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

# Simple in-memory rate limiter for AI calls: {username: (minute_ts, count)}
ai_rate_limits: dict = {}
ai_rate_lock = asyncio.Lock()
AI_RATE_LIMIT_PER_MIN = 20

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
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "D", "location": "main.py:385", "message": "get_bot_status called", "data": {"bot_state_is_running": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    try:
        runner_status = bot_runner.get_bot_status()
        actual_running = bool(runner_status.get("running"))
        
        # Calculate actual uptime from bot start time
        uptime = 0
        if actual_running and runner_status.get("start_time"):
            from datetime import timedelta
            gmt7 = timezone(timedelta(hours=7))
            uptime = int((datetime.now(gmt7) - datetime.fromisoformat(runner_status["start_time"])).total_seconds())
        
        # Update bot_state with actual uptime
        bot_state["uptime"] = uptime
    except Exception:
        actual_running = False

    prev_running = bool(bot_state.get("is_running"))
    if prev_running != actual_running:
        bot_state["is_running"] = actual_running
        if not actual_running:
            bot_state["start_time"] = None
            bot_state["uptime"] = 0
        await manager.broadcast_bot_status(bot_state)

    return BotStatus(
        is_running=actual_running,
        uptime=bot_state.get("uptime", 0),  # Use actual bot uptime
        last_activity=bot_state.get("last_activity"),
        total_messages_sent=bot_state.get("total_messages_sent", 0),
        total_messages_received=bot_state.get("total_messages_received", 0)
    )

@app.post("/api/bot/start")
async def start_bot(
    current_user: User = Depends(check_permission(Permission.CONTROL_BOT)) 
):
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "A", "location": "main.py:388", "message": "API /api/bot/start called", "data": {"username": current_user.username, "is_running_before": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
        global bot_start_lock
        async with bot_start_lock:
            if bot_state["is_running"]:
                return {"message": "Bot is already running", "status": bot_state}
        
        try:
            if not settings.zalo_api_key or not settings.zalo_secret_key or not settings.zalo_imei:
                error_detail = "Missing Zalo credentials. Please set ZALO_API_KEY, ZALO_SECRET_KEY, ZALO_IMEI."
                logger.error(f"Bot start failed: {error_detail}")
                await manager.broadcast_log("ERROR", error_detail)
                raise HTTPException(status_code=400, detail=error_detail)

            if not settings.zalo_cookies or settings.zalo_cookies.strip() in ("{}", "", "null", "None"):
                error_detail = "Missing ZALO_COOKIES. Cookie login is required; phone/password login is not supported by zlapi."
                logger.error(f"Bot start failed: {error_detail}")
                await manager.broadcast_log("ERROR", error_detail)
                raise HTTPException(status_code=400, detail=error_detail)

            try:
                cookies = json.loads(settings.zalo_cookies)
            except json.JSONDecodeError as e:
                error_detail = f"Invalid ZALO_COOKIES JSON format: {e}"
                logger.error(f"Bot start failed: {error_detail}")
                await manager.broadcast_log("ERROR", error_detail)
                raise HTTPException(status_code=400, detail=error_detail)

            logger.info(f"Initializing bot with API key, secret, IMEI, and cookies for user {current_user.username}")
            bot_runner.initialize_bot(
                settings.zalo_api_key, 
                settings.zalo_secret_key, 
                settings.zalo_imei, 
                cookies
            )
            
            logger.info("Starting bot background task...")
            asyncio.create_task(asyncio.to_thread(bot_runner.start_bot_background))
            
            bot_state["is_running"] = True
            from datetime import timedelta
            gmt7 = timezone(timedelta(hours=7))
            bot_state["start_time"] = datetime.now(gmt7).isoformat()
            bot_state["last_activity"] = datetime.now(gmt7).isoformat()
            # #region agent log
            with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "main.py:411", "message": "Bot state updated after start", "data": {"is_running": bot_state["is_running"], "start_time": bot_state["start_time"]}, "timestamp": int(time.time() * 1000)}) + "\n")
            # #endregion
            
            await manager.broadcast_bot_status(bot_state)
            await manager.broadcast_log("INFO", f"Bot đã được khởi động bởi {current_user.username}")
            
            return {"message": "Bot started successfully", "status": bot_state}
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Unexpected error starting bot: {error_msg}", exc_info=True)
            await manager.broadcast_log("ERROR", f"Lỗi khởi động bot: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Internal error: {error_msg}")

@app.post("/api/bot/stop")
async def stop_bot(
    current_user: User = Depends(check_permission(Permission.CONTROL_BOT))
):
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "main.py:421", "message": "API /api/bot/stop called", "data": {"username": current_user.username, "is_running_before": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "A", "location": "main.py:421", "message": "API /api/bot/stop called", "data": {"username": current_user.username, "is_running_before": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    
    # Thực sự dừng bot thread
    try:
        bot_runner.stop_bot()
    except Exception as e:
        print(f"Error stopping bot runner: {e}")
    
    bot_state["is_running"] = False
    bot_state["start_time"] = None
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "main.py:438", "message": "Bot state updated after stop", "data": {"is_running": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
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
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "A", "location": "main.py:437", "message": "API /api/bot/restart called", "data": {"username": current_user.username, "is_running_before": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    
    # Thực sự dừng bot thread trước khi restart
    try:
        bot_runner.stop_bot()
    except Exception as e:
        print(f"Error stopping bot runner during restart: {e}")
    
    bot_state["is_running"] = False
    bot_state["start_time"] = None
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "main.py:457", "message": "Bot state updated before restart", "data": {"is_running": bot_state["is_running"]}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    await manager.broadcast_log("INFO", f"Bot restarting by {current_user.username}...")
    
    # Clear logs when bot restarts
    db = await get_database()
    await db.logs.delete_many({})
    
    await asyncio.sleep(1)
    
    # Khởi động lại bot
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
        from datetime import timedelta
        gmt7 = timezone(timedelta(hours=7))
        bot_state["start_time"] = datetime.now(gmt7).isoformat()
        bot_state["last_activity"] = datetime.now(gmt7).isoformat()
        await manager.broadcast_bot_status(bot_state)
        await manager.broadcast_log("INFO", "Bot restarted successfully")
    except Exception as e:
        error_msg = str(e)
        print(f"Error restarting bot: {error_msg}")
        await manager.broadcast_log("ERROR", f"Lỗi khởi động lại: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    
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


class BotActivityPayload(BaseModel):
    messages_sent: int = 0
    messages_received: int = 0
    commands_used: int = 0


@app.post("/api/bot/activity")
async def report_bot_activity(payload: BotActivityPayload):
    """Called by bot process to report message/command activity (no auth for internal use)."""
    # Use GMT+7 (Bangkok/Hanoi/Jakarta timezone)
    from datetime import timedelta
    gmt7 = timezone(timedelta(hours=7))
    now = datetime.now(gmt7)
    today = now.date()
    if bot_state.get("activity_date") != today:
        bot_state["activity_date"] = today
        bot_state["messages_today"] = 0
        bot_state["activity_history"] = {}
    hour_key = now.strftime("%H:00")
    bot_state["activity_history"][hour_key] = bot_state["activity_history"].get(hour_key, 0) + (
        payload.messages_sent + payload.messages_received
    )
    bot_state["total_messages_sent"] = bot_state.get("total_messages_sent", 0) + payload.messages_sent
    bot_state["total_messages_received"] = bot_state.get("total_messages_received", 0) + payload.messages_received
    bot_state["messages_today"] = bot_state.get("messages_today", 0) + (
        payload.messages_sent + payload.messages_received
    )
    bot_state["active_commands"] = bot_state.get("active_commands", 0) + payload.commands_used
    bot_state["last_activity"] = now.isoformat()
    return {"ok": True}


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

@app.get("/api/command-logs", response_model=List[CommandLog])
async def get_command_logs(
    limit: int = 100,
    command_type: Optional[str] = None,
    current_user: User = Depends(check_permission(Permission.VIEW_LOGS))
):
    """Get command/activity logs with user interaction support"""
    db = await get_database()
    query = {}
    if command_type:
        query["command_type"] = command_type
    
    logs = []
    async for log in db.command_logs.find(query).sort("timestamp", -1).limit(limit):
        logs.append(CommandLog(
            id=str(log["_id"]),
            timestamp=log["timestamp"],
            command_type=log["command_type"],
            message=log["message"],
            raw_content=log["raw_content"],
            user_info=log.get("user_info"),
            thread_id=log.get("thread_id"),
            details=log.get("details")
        ))
    return logs

@app.post("/api/command-logs")
async def create_command_log(log: dict):
    """Endpoint for bot to send command/activity logs with user info"""
    db = await get_database()
    log_entry = {
        "_id": ObjectId(),
        "timestamp": datetime.utcnow(),
        "command_type": log.get("command_type", "user_command"),
        "message": log.get("message", ""),
        "raw_content": log.get("raw_content", ""),
        "user_info": log.get("user_info"),
        "thread_id": log.get("thread_id"),
        "details": log.get("details", {})
    }
    await db.command_logs.insert_one(log_entry)
    
    # Broadcast to WebSocket if enabled
    if logging_enabled:
        await manager.broadcast({
            "type": "command_log",
            "id": str(log_entry["_id"]),
            "timestamp": log_entry["timestamp"].isoformat(),
            "command_type": log_entry["command_type"],
            "message": log_entry["message"],
            "raw_content": log_entry["raw_content"],
            "user_info": log_entry["user_info"],
            "thread_id": log_entry["thread_id"]
        })
    
    return {"message": "Command log created successfully"}

@app.get("/api/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(check_permission(Permission.VIEW_USERS))
):
    """Get detailed user profile with statistics"""
    db = await get_database()
    
    # Get user basic info
    user_dict = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count user's commands/messages from logs
    command_count = await db.command_logs.count_documents({
        "user_info.user_id": user_id
    })
    
    # Create user profile
    profile = UserProfile(
        id=str(user_dict["_id"]),
        username=user_dict["username"],
        email=user_dict.get("email"),
        full_name=user_dict.get("full_name"),
        role=user_dict["role"],
        is_active=user_dict["is_active"],
        created_at=user_dict["created_at"],
        last_login=user_dict.get("last_login"),
        total_commands=command_count,
        total_messages=command_count  # For now, same as commands
    )
    
    return profile

@app.post("/api/logs")
async def create_log(log: dict):
    """Endpoint for bot to send logs. When logging is OFF: no store, no broadcast, no console. When ON: store, broadcast, and print to Render console."""
    if not logging_enabled:
        return {"message": "logging disabled"}

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
    # Print to stdout so it appears on Render.com console
    print(f"[{log_entry['level']}] {log_entry['message']}", flush=True)

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
    if bot_state["is_running"]:
        # Try to get actual bot start time from bot_runner
        try:
            runner_status = bot_runner.get_bot_status()
            bot_start_time = runner_status.get("start_time")
            if bot_start_time:
                from datetime import timedelta
                gmt7 = timezone(timedelta(hours=7))
                uptime_seconds = int((datetime.now(gmt7) - datetime.fromisoformat(bot_start_time)).total_seconds())
            else:
                # Fallback to web start time
                if bot_state.get("start_time"):
                    from datetime import timedelta
                    gmt7 = timezone(timedelta(hours=7))
                    uptime_seconds = int((datetime.now(gmt7) - datetime.fromisoformat(bot_state["start_time"])).total_seconds())
        except Exception:
            # Fallback to web start time
            if bot_state.get("start_time"):
                from datetime import timedelta
                gmt7 = timezone(timedelta(hours=7))
                uptime_seconds = int((datetime.now(gmt7) - datetime.fromisoformat(bot_state["start_time"])).total_seconds())

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
    from datetime import timedelta
    gmt7 = timezone(timedelta(hours=7))
    now = datetime.now(gmt7)
    for i in range(5, -1, -1):
        hour_time = now - timedelta(hours=i)
        time_key = hour_time.strftime("%H:00")
        messages = activity_history.get(time_key, 0)
        activity_data.append(ActivityPoint(time=time_key, messages=messages))
    
    stats = DashboardStats(
        total_users=total_users,
        bot_uptime=uptime_seconds,
        messages_today=bot_state.get("messages_today", 0),
        active_commands=bot_state.get("active_commands", 0),
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


@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    user_id = f"chat_{int(time.time() * 1000)}"
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


class AIRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class AIResponse(BaseModel):
    reply: str


@app.post("/api/ai/chat", response_model=AIResponse)
async def ai_chat(
    request: AIRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Chat with AI using Gemini with API key rotation."""
    if not generate_ai_content:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        # Apply rate limiting
        async with ai_rate_lock:
            username = current_user.username
            now = int(time.time() // 60)  # Current minute timestamp
            user_limit = ai_rate_limits.get(username, (now, 0))
            
            # Reset counter if new minute
            if user_limit[0] != now:
                ai_rate_limits[username] = (now, 1)
            else:
                # Check rate limit
                if user_limit[1] >= AI_RATE_LIMIT_PER_MIN:
                    raise HTTPException(
                        status_code=429, 
                        detail=f"Rate limit exceeded. Max {AI_RATE_LIMIT_PER_MIN} requests per minute."
                    )
                ai_rate_limits[username] = (now, user_limit[1] + 1)
        
        # Generate response
        reply = generate_ai_content(request.message, user_role=current_user.role)
        return AIResponse(reply=reply)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# Gemini API Key Management Endpoints
@app.get("/api/gemini/status")
async def get_gemini_status(
    current_user: User = Depends(check_permission(Permission.VIEW_BOT_STATUS))
):
    """Get status of Gemini API keys for monitoring."""
    if not get_api_key_status:
        raise HTTPException(status_code=503, detail="Gemini client not available")
    
    try:
        status = get_api_key_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Gemini status: {str(e)}")


@app.post("/api/gemini/reset-keys")
async def reset_gemini_keys(
    current_user: User = Depends(check_permission(Permission.CONFIGURE_BOT))
):
    """Reset failed Gemini API keys (manual intervention)."""
    if not reset_failed_keys:
        raise HTTPException(status_code=503, detail="Gemini client not available")
    
    try:
        reset_failed_keys()
        await manager.broadcast_log("INFO", f"Gemini API keys reset by {current_user.username}")
        return {"message": "Failed API keys reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset API keys: {str(e)}")


# Chat System Endpoints
@app.post("/api/chat/session")
async def create_chat_session(
    session_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new chat session for user to communicate with admins/mods."""
    try:
        db = await get_database()
        
        # Generate unique session ID
        session_id = f"chat_{int(time.time())}_{current_user.id}"
        
        # Create chat session
        chat_session = {
            "_id": ObjectId(),
            "sessionId": session_id,
            "userId": current_user.id,
            "username": current_user.username,
            "fullName": session_data.get("fullName"),
            "userRole": current_user.role,
            "userType": session_data.get("userType", current_user.role),
            "createdAt": datetime.now(timezone.utc),
            "lastActivity": datetime.now(timezone.utc),
            "messages": [],
            "isActive": True,
            "targetType": None  # Will be set when first message is sent
        }
        
        await db.chat_sessions.insert_one(chat_session)
        
        return {
            "sessionId": session_id,
            "messages": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")


@app.post("/api/chat/message")
async def send_chat_message(
    message_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Send a message from user to admins/mods."""
    try:
        db = await get_database()
        session_id = message_data.get("sessionId")
        content = message_data.get("content")
        target_type = message_data.get("targetType", "admin")
        
        if not session_id or not content:
            raise HTTPException(status_code=400, detail="Session ID and content are required")
        
        # Update session target type if not set
        await db.chat_sessions.update_one(
            {"sessionId": session_id, "userId": current_user.id},
            {
                "$set": {
                    "targetType": target_type,
                    "lastActivity": datetime.now(timezone.utc)
                }
            }
        )
        
        # Create message
        message = {
            "_id": ObjectId(),
            "sessionId": session_id,
            "content": content,
            "sender": {
                "id": current_user.id,
                "username": current_user.username,
                "fullName": current_user.full_name,
                "role": current_user.role
            },
            "timestamp": datetime.now(timezone.utc),
            "type": "user",
            "targetType": target_type
        }
        
        # Add message to session
        await db.chat_sessions.update_one(
            {"sessionId": session_id},
            {"$push": {"messages": message}}
        )
        
        # Broadcast to admins/mods via WebSocket
        await manager.broadcast({
            "type": "new_chat_message",
            "message": {
                "id": str(message["_id"]),
                "sessionId": session_id,
                "content": content,
                "sender": message["sender"],
                "timestamp": message["timestamp"].isoformat(),
                "type": "user",
                "targetType": target_type
            }
        })
        
        # Auto-reply logic (simple for now)
        auto_reply = "Cảm ơn tin nhắn của bạn. Quản trị viên sẽ phản hồi sớm nhất có thể."
        
        return {
            "reply": auto_reply,
            "messageId": str(message["_id"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@app.delete("/api/chat/session/{session_id}")
async def cleanup_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Clean up chat session (called after 20 minutes or page reload)."""
    try:
        db = await get_database()
        
        # Delete session and messages
        result = await db.chat_sessions.delete_one({
            "sessionId": session_id,
            "userId": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session cleaned up successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup session: {str(e)}")


@app.get("/api/chat/admin/sessions")
async def get_admin_chat_sessions(
    target_type: str = "admin",
    current_user: User = Depends(check_permission(Permission.VIEW_LOGS))
):
    """Get all active chat sessions for admins/mods."""
    try:
        db = await get_database()
        
        # Get active sessions for the specified target type
        sessions = await db.chat_sessions.find({
            "targetType": target_type,
            "isActive": True,
            "lastActivity": {"$gte": datetime.now(timezone.utc) - timedelta(minutes=20)}
        }).sort("lastActivity", -1).to_list(length=100)
        
        # Convert ObjectId to string and format
        formatted_sessions = []
        for session in sessions:
            formatted_sessions.append({
                "id": str(session["_id"]),
                "sessionId": session["sessionId"],
                "userId": session["userId"],
                "username": session["username"],
                "fullName": session.get("fullName"),
                "userRole": session["userRole"],
                "targetType": session["targetType"],
                "createdAt": _json_safe(session["createdAt"]),
                "lastActivity": _json_safe(session["lastActivity"]),
                "messages": _json_safe(session.get("messages", []))
            })
        
        return {"sessions": formatted_sessions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")


@app.get("/api/chat/admin/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(check_permission(Permission.VIEW_LOGS))
):
    """Get all messages for a specific chat session."""
    try:
        db = await get_database()
        
        session = await db.chat_sessions.find_one({"sessionId": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "messages": _json_safe(session.get("messages", []))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@app.post("/api/chat/admin/message")
async def send_admin_message(
    message_data: dict,
    current_user: User = Depends(check_permission(Permission.VIEW_LOGS))
):
    """Send a message from admin/mod to user."""
    try:
        db = await get_database()
        session_id = message_data.get("sessionId")
        content = message_data.get("content")
        sender_type = message_data.get("senderType", current_user.role)
        
        if not session_id or not content:
            raise HTTPException(status_code=400, detail="Session ID and content are required")
        
        # Create admin message
        message = {
            "_id": ObjectId(),
            "sessionId": session_id,
            "content": content,
            "sender": {
                "id": current_user.id,
                "username": current_user.username,
                "fullName": current_user.full_name,
                "role": current_user.role
            },
            "timestamp": datetime.now(timezone.utc),
            "type": "admin",
            "senderType": sender_type
        }
        
        # Add message to session
        await db.chat_sessions.update_one(
            {"sessionId": session_id},
            {
                "$push": {"messages": message},
                "$set": {"lastActivity": datetime.now(timezone.utc)}
            }
        )
        
        # Broadcast to user via WebSocket
        await manager.broadcast({
            "type": "admin_reply",
            "sessionId": session_id,
            "message": {
                "id": str(message["_id"]),
                "content": content,
                "sender": message["sender"],
                "timestamp": message["timestamp"].isoformat(),
                "type": "admin"
            }
        })
        
        return {"messageId": str(message["_id"])}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send admin message: {str(e)}")


# Cleanup old chat sessions (runs every 5 minutes)
@app.delete("/api/chat/cleanup-old")
async def cleanup_old_chat_sessions():
    """Clean up chat sessions older than 20 minutes."""
    try:
        db = await get_database()
        
        # Delete sessions older than 20 minutes
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=20)
        result = await db.chat_sessions.delete_many({
            "lastActivity": {"$lt": cutoff_time}
        })
        
        return {
            "deleted_count": result.deleted_count,
            "message": f"Cleaned up {result.deleted_count} old sessions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup old sessions: {str(e)}")


# Auto cleanup task (runs every 5 minutes)
async def auto_cleanup_chat_sessions():
    """Automatically clean up old chat sessions."""
    while True:
        try:
            await cleanup_old_chat_sessions()
        except Exception as e:
            logger.error(f"Auto cleanup failed: {e}")
        
        # Wait 5 minutes
        await asyncio.sleep(300)


# Catch all other routes and serve the frontend (for SPA routing)
@app.get("/{path:path}", include_in_schema=False)
async def catch_all(path: str):
    """Catch all routes for SPA routing"""
    # API routes
    if path.startswith("api/") or path == "health":
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Static files (favicon, manifest, assets, etc.)
    if FRONTEND_AVAILABLE:
        try:
            requested = (FRONTEND_DIST_DIR / path).resolve()
            dist_root = FRONTEND_DIST_DIR.resolve()
            if dist_root in requested.parents and requested.is_file():
                return FileResponse(str(requested))
        except Exception:
            pass

    # Frontend routes
    if FRONTEND_AVAILABLE:
        try:
            return FileResponse(str(FRONTEND_INDEX_FILE))
        except Exception as e:
            print(f"⚠️  Frontend file not found: {e}")

    # Fallback for missing frontend
    return {
        "message": "Zalo Bot Manager API",
        "status": "running",
        "requested_path": f"/{path}",
        "endpoints": {
            "health": "/health",
            "api_docs": "/docs",
            "api_health": "/api/health"
        },
        "note": "Frontend build files not found. Please build the frontend first."
    }


if __name__ == "__main__":
    import uvicorn
    import logging
    import os
    
    # Get port from Render environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"  # Required for Render
    
    # Suppress all logs for faster startup
    logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
    logging.getLogger("uvicorn").setLevel(logging.ERROR)
    logging.getLogger("starlette").setLevel(logging.ERROR)
    logging.getLogger("fastapi").setLevel(logging.ERROR)
    
    # Fast startup config
    print(f"🚀 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        access_log=False,
        log_level="error",
        workers=1,  # Single worker for memory efficiency
        limit_concurrency=50,  # Limit concurrent connections
        timeout_keep_alive=30,  # Faster timeout
        timeout_graceful_shutdown=10,  # Faster shutdown
    )