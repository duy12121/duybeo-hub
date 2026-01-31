import time
import json
import re
import asyncio
import unicodedata
from threading import Thread
from datetime import datetime
from typing import Optional

import requests

try:
    from urllib3.connection import HTTPConnection
    original_putheader = HTTPConnection.putheader
    
    def patched_putheader(self, header, *values):
        """Patched putheader that handles Unicode characters"""
        normalized_values = []
        for value in values:
            if isinstance(value, str):
                try:
                    value.encode('latin-1')
                    normalized_values.append(value)
                except UnicodeEncodeError:
                    cleaned = ''.join(c for c in value if ord(c) < 256 or c.encode('utf-8', 'ignore'))
                    try:
                        cleaned.encode('latin-1')
                        normalized_values.append(cleaned)
                    except:
                        cleaned = ''.join(c if ord(c) < 128 else '?' for c in value)
                        normalized_values.append(cleaned)
            else:
                normalized_values.append(value)
        
        return original_putheader(self, header, *normalized_values)
    
    HTTPConnection.putheader = patched_putheader
except Exception as e:
    print(f"[WARNING] Could not patch urllib3: {e}")

class BotLogger:
    """Logger that sends logs to web dashboard with nice formatting"""
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.enabled = True
        self.colors = {
            "INFO": "\033[94m",      # Blue
            "WARNING": "\033[93m",   # Yellow
            "ERROR": "\033[91m",     # Red
            "DEBUG": "\033[96m",     # Cyan
            "SUCCESS": "\033[92m",   # Green
            "RESET": "\033[0m"       # Reset
        }
    
    def _format_message(self, level: str, message: str) -> str:
        """Format message with colors and timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = self.colors.get(level, "")
        reset = self.colors["RESET"]
        
        # Level badge
        level_badge = f"[{level:7}]"
        
        return f"{color}{level_badge}{reset} {timestamp} | {message}"
    
    def _send_log(self, level: str, message: str, details: dict = None):
        """Send log to dashboard API"""
        if not self.enabled:
            return
            
        try:
            log_data = {
                "level": level.upper(),
                "message": message,
                "details": details or {}
            }
            requests.post(
                f"{self.api_url}/api/logs",
                json=log_data,
                timeout=3
            )
        except Exception as e:
            pass  # Silently fail for API calls
    
    def info(self, message: str, details: dict = None):
        self._send_log("INFO", message, details)
        print(self._format_message("INFO", message))
    
    def warning(self, message: str, details: dict = None):
        self._send_log("WARNING", message, details)
        print(self._format_message("WARNING", message))
    
    def error(self, message: str, details: dict = None):
        self._send_log("ERROR", message, details)
        print(self._format_message("ERROR", message))
    
    def debug(self, message: str, details: dict = None):
        self._send_log("DEBUG", message, details)
        print(self._format_message("DEBUG", message))
    
    def success(self, message: str, details: dict = None):
        self._send_log("SUCCESS", message, details)
        print(self._format_message("SUCCESS", message))


logger = BotLogger()


try:
    from zlapi import ZaloAPI, ThreadType, Message
    ZLAPI_AVAILABLE = True
except ImportError:
    ZLAPI_AVAILABLE = False
    logger.warning("zlapi not installed - bot will run in mock mode")

    class ThreadType:
        GROUP = "GROUP"
        USER = "USER"
    
    class Message:
        def __init__(self, text=""):
            self.text = text
    
    class ZaloAPI:
        def __init__(self, *args, **kwargs):
            pass
        
        def fetchAccountInfo(self):
            class Profile:
                displayName = "Mock Bot"
            class Account:
                profile = Profile()
            return Account()


SETTING_FILE = 'bot/setting.json'


def load_settings():
    """Load settings from JSON file"""
    try:
        with open(SETTING_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("setting.json not found, creating default")
        default_settings = {
            "admin_bot": [],
            "allowed_thread_ids": [],
            "forbidden_words": [],
            "muted_users": [],
            "violations": {},
            "rules": {
                "word": {"threshold": 3, "duration": 30},
                "spam": {"threshold": 3, "duration": 30}
            },
            "group_admins": {},
            "message_log": {},
            "allow_link": {},
            "block_user_group": {}
        }
        save_settings(default_settings)
        return default_settings
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse setting.json: {e}")
        return {}


def save_settings(settings):
    """Save settings to JSON file"""
    try:
        with open(SETTING_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")


def is_admin(author_id):
    """Check if user is bot admin"""
    settings = load_settings()
    admin_bot = settings.get("admin_bot", [])
    return author_id in admin_bot


def get_allowed_thread_ids():
    """Get list of allowed thread IDs"""
    settings = load_settings()
    return settings.get('allowed_thread_ids', [])


def normalize_unicode_to_ascii(text: str) -> str:
    """
    Normalize problematic fullwidth Unicode characters only.
    Keep all other characters intact to preserve cookie integrity.
    """
    if not text:
        return text
    try:
        result = []
        for char in text:

            if '\uff10' <= char <= '\uff19':
                result.append(chr(ord(char) - 0xfee0))
            elif '\uff21' <= char <= '\uff3a':
                result.append(chr(ord(char) - 0xfee0))
            elif '\uff41' <= char <= '\uff5a':
                result.append(chr(ord(char) - 0xfee0)) 
            else:

                result.append(char)
        return ''.join(result)
    except Exception as e:
        logger.warning(f"Error normalizing unicode: {e}")
        return text


class ZaloBotRunner:
    """
    Zalo Bot Runner with Web Dashboard Integration
    """
    def __init__(self, api_key: str, secret_key: str, imei: str = None, session_cookies: dict = None):
        self.api_key = api_key
        self.secret_key = secret_key
        self.imei = imei
        self.session_cookies = session_cookies
        self.bot = None
        self.running = False
        
        logger.info("Initializing Zalo Bot Runner")
    
    def start(self):
        """Start the bot"""
        if not ZLAPI_AVAILABLE:
            logger.error("zlapi not available - cannot start bot")
            logger.info("Running in mock mode for testing")
            self._run_mock_bot()
            return
        
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Starting Zalo Bot (Attempt {attempt}/{max_retries})", details={
                    "imei": self.imei if self.imei else "Not provided",
                    "cookies": "Provided" if self.session_cookies else "Not provided"
                })

                normalized_cookies = None
                if self.session_cookies:
                    normalized_cookies = {}
                    for key, value in self.session_cookies.items():
                        if isinstance(value, str):
                            normalized_cookies[key] = normalize_unicode_to_ascii(value)
                        else:
                            normalized_cookies[key] = value

                from bot_integrated import Bot
                self.bot = Bot(
                    self.api_key,
                    self.secret_key,
                    imei=self.imei,
                    session_cookies=normalized_cookies
                )
            
                
                self.running = True
                bot_name = getattr(self.bot, 'me_name', 'Unknown Bot')
                logger.info(f"Bot started successfully: {bot_name}")

                self.bot.listen(thread=True, reconnect=5)

                return
                
            except Exception as e:
                error_str = str(e)
                logger.error(f"Attempt {attempt}/{max_retries} failed: {error_str}", details={
                    "error_type": type(e).__name__,
                    "attempt": attempt
                })
                
                if "login" in error_str.lower() or "cookie" in error_str.lower() or "subscriptable" in error_str.lower():
                    if attempt < max_retries:
                        logger.warning(f"Login error detected. Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                    else:
                        logger.error("Max retries exceeded. Bot startup failed.", details={
                            "reason": "Cookies may have expired or login credentials are invalid",
                            "suggestion": "Please re-authenticate by updating bot credentials via web dashboard"
                        })
                        raise
                else:
                    raise
    
    def _run_mock_bot(self):
        """Run mock bot for testing without zlapi"""
        self.running = True
        logger.info("Mock bot started (zlapi not installed)")

        def mock_activity():
            count = 0
            while self.running:
                time.sleep(10)
                count += 1
                logger.info(f"Mock bot heartbeat #{count}", details={
                    "status": "running",
                    "mode": "mock"
                })
        
        thread = Thread(target=mock_activity, daemon=True)
        thread.start()
    
    def stop(self):
        """Stop the bot"""
        self.running = False
        logger.info("Bot stopped")


bot_runner = None 

def initialize_bot(api_key, secret_key, imei=None, session_cookies=None):
    """Initialize bot runner"""
    global bot_runner
    new_runner = ZaloBotRunner(api_key, secret_key, imei, session_cookies)
    bot_runner = new_runner
    print(f"[DEBUG] Đã gán bot_runner: {id(bot_runner)}")
    return bot_runner

def start_bot_background():
    global bot_runner 
    
    retry = 0
    while bot_runner is None and retry < 5:
        time.sleep(1)
        retry += 1
        print(f"⏳ Đang đợi nạp Bot Runner (lần {retry})...")

    if bot_runner is None:
        print(f"[ERROR] Bot not initialized. Biến hiện tại: {bot_runner}")
        return False
    
    try:

        t = Thread(target=bot_runner.start, daemon=True)
        t.start()
        print("🚀 Thread Bot đã phát lệnh khởi hành!")
        return True
    except Exception as e:
        print(f"[ERROR] Không thể khởi động thread Bot: {e}")
        return False


def stop_bot():
    """Stop the bot"""
    global bot_runner
    
    if bot_runner:
        bot_runner.stop()
        return True
    return False


def get_bot_status():
    """Get bot status"""
    global bot_runner
    
    if bot_runner is None:
        return {
            "running": False,
            "initialized": False
        }
    
    return {
        "running": bot_runner.running,
        "initialized": True,
        "mode": "real" if ZLAPI_AVAILABLE else "mock"
    }
