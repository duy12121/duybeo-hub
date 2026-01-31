from typing import List, Dict
from fastapi import WebSocket
import json
from datetime import datetime, timezone

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients.

        This uses a JSON encoder that knows how to serialize datetimes and
        Pydantic/other objects that expose a `.dict()` method. Fallbacks to
        `str()` for unknown types.
        """
        def _default(o):
            # datetime -> ISO
            if isinstance(o, datetime):
                return o.isoformat()
            # Pydantic models and similar
            if hasattr(o, 'dict') and callable(getattr(o, 'dict')):
                try:
                    return o.dict()
                except Exception:
                    return str(o)
            # Fallback
            return str(o)

        try:
            message_str = json.dumps(message, default=_default)
        except Exception as e:
            # As a last resort, stringify the whole message
            message_str = json.dumps({"type": "error", "error": "serialize_failed", "raw": str(message)})
            print(f"Warning: failed to JSON-serialize message: {e}")

        disconnected = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_str)
            except Exception as e:
                print(f"Error sending message: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)
    
    async def broadcast_log(self, level: str, message: str, details: dict = None):
        """Broadcast a log entry to all connected clients"""
        log_entry = {
            "type": "log",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
            "details": details or {}
        }
        await self.broadcast(log_entry)
    
    async def broadcast_bot_status(self, status: dict):
        """Broadcast bot status update"""
        status_update = {
            "type": "bot_status",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": status
        }
        await self.broadcast(status_update)
    
    async def broadcast_dashboard_stats(self, stats: dict):
        """Broadcast dashboard statistics to all connected clients"""
        stats_update = {
            "type": "dashboard_stats",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": stats
        }
        await self.broadcast(stats_update)

manager = ConnectionManager()
