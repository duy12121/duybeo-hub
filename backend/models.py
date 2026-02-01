from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # Quản trị viên cấp cao
    ADMIN = "admin"  # Quản trị viên
    MODERATOR = "moderator"  # Kiểm duyệt
    VIEWER = "viewer"  # Người qua đường

class Permission(str, Enum):
    # User Management
    MANAGE_USERS = "manage_users"
    CREATE_USERS = "create_users"
    VIEW_USERS = "view_users"
    
    # Bot Control
    CONTROL_BOT = "control_bot"
    VIEW_BOT_STATUS = "view_bot_status"
    CONFIGURE_BOT = "configure_bot"
    
    # Logs
    VIEW_LOGS = "view_logs"
    EXPORT_LOGS = "export_logs"
    
    # Commands
    MANAGE_COMMANDS = "manage_commands"
    VIEW_COMMANDS = "view_commands"
    
    # System
    MANAGE_SYSTEM = "manage_system"

# Role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: [p.value for p in Permission],
    UserRole.ADMIN: [
        Permission.CREATE_USERS,
        Permission.VIEW_USERS,
        Permission.CONTROL_BOT,
        Permission.VIEW_BOT_STATUS,
        Permission.CONFIGURE_BOT,
        Permission.VIEW_LOGS,
        Permission.EXPORT_LOGS,
        Permission.VIEW_COMMANDS,
        Permission.MANAGE_COMMANDS,
    ],
    UserRole.MODERATOR: [
        Permission.CONTROL_BOT,
        Permission.VIEW_BOT_STATUS,
        Permission.VIEW_LOGS,
        Permission.VIEW_COMMANDS,
    ],
    UserRole.VIEWER: [
        Permission.VIEW_BOT_STATUS,
        Permission.VIEW_LOGS,
        Permission.VIEW_COMMANDS,
    ],
}

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.VIEWER

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserInDB(UserBase):
    id: PyObjectId = Field(alias="_id")
    hashed_password: str 
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    permissions: List[str]
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class BotStatus(BaseModel):
    is_running: bool
    uptime: int  # seconds
    last_activity: Optional[datetime] = None
    total_messages_sent: int
    total_messages_received: int
    active_users: int

class BotCommand(BaseModel):
    command: str
    description: str
    usage: str
    is_enabled: bool = True

class BotConfig(BaseModel):
    auto_reply: bool = True
    log_messages: bool = True
    forward_to_admin: bool = False
    custom_settings: dict = {}

class LogEntry(BaseModel):
    id: str = Field(alias="_id")
    timestamp: datetime
    level: str  # INFO, WARNING, ERROR, DEBUG
    message: str
    details: Optional[dict] = None
    
    class Config:
        populate_by_name = True

class CommandLog(BaseModel):
    id: str = Field(alias="_id")
    timestamp: datetime
    command_type: str  # "user_command", "bot_response", "system_action"
    message: str
    raw_content: str  # Nội dung thô của lệnh/log
    user_info: Optional[dict] = None  # Thông tin user nếu có
    thread_id: Optional[str] = None  # ID cuộc trò chuyện
    details: Optional[dict] = None
    
    class Config:
        populate_by_name = True

class UserProfile(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    total_commands: int = 0
    total_messages: int = 0
    
    class Config:
        populate_by_name = True

class UserBreakdown(BaseModel):
    super_admin: int = 0
    admin: int = 0
    moderator: int = 0
    viewer: int = 0

class ActivityPoint(BaseModel):
    time: str
    messages: int

class DashboardStats(BaseModel):
    total_users: int
    bot_uptime: int
    messages_today: int
    active_commands: int
    recent_logs: List[LogEntry]
    user_breakdown: Optional[UserBreakdown] = None
    activity_data: Optional[List[ActivityPoint]] = None
