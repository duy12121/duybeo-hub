#  ========================================
# mong ngài phù hộ cho bot chạy bình thường
#  ========================================
#⠀⠀ ⠀⠀⠀⠀⠀⠀⠀⠀ ⢀⠤⠒⠒⠢⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀ ⠀⠀⠀⠀⠀⠀  ⢀⡯⠴⠶⠶⠒⠢⢇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀ ⠀⠀⠀⠀⠀⠀⠀  ⡎⡤⠖⠂⡀⠒⡢⡌⢣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀ ⠀⠀⠀⠀⠀⠀⠀⣷⠯⢭⣵⠑⣯⡭⢹⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀ ⠀⠀⠀⠀⠀⠀⢻⡆⠀⢠⣤⠄⠀⣸⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⠀ ⠀⠀⠀⠀⠀⠸⣷⢄⣈⣟⢁⢴⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⠀⠀⠀⣀⢴⠒⡝⠁⠬⠛⣚⡩⠔⠉⢻⠒⣦⢄⠀⠀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⠀⢀⢎⠁⡌⢰⠁⠀⠀⠀⠀⠀⠀⠀⢸⠀⡛⠀⡷⡀⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⣀⣾⣷⣠⠃⢸⠀⠀⠀⠀⠀⠀⠀⠀⣸⠀⢹⢰⠁⢳⠀⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⢸⡿⠟⢿⢳⡏⠀⠀⠀⠀⠀⠀⠀⢠⡟⣶⣘⢞⡀⠘⡆⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⡼⢺⣯⢹⢰⡏⠒⠒⠒⠊⠀⠐⢒⣾⣹⣸⢹⣾⡇⠀⢣⠀⠀⠀⠀⠀
#⠀⠀⠀⠀⣏⣾⠃⠀⣼⡟⣢⣀⡠⠤⣀⡰⢋⡝⣱⣹⠇⣿⣧⣴⠸⡄⠀⠀⠀⠀
#⠀⠀⠀⠀⡏⡞⡆⢠⡇⣟⠭⡒⠭⠭⠤⠒⣡⠔⣽⡇⣂⣿⠟⠃⢀⡇⠀⠀⠀⠀
#⠀⠀⠀⠀⢧⡇⡧⢫⠃⣷⣽⣒⣍⣉⣈⡩⢴⠾⡳⢡⢸⣛⣪⡗⢴⠁⠀⠀⠀⠀
#⠀⠀⠀⠀⣼⢃⠷⣸⣤⣯⢞⡥⢍⣐⣂⠨⠅⠊⡠⢃⣟⢏⠹⣎⣆⡀⠀⠀⠀⠀
#⠀⡠⠶⠚⠛⠛⠽⢹⡟⡖⢓⠿⣝⠓⠒⠒⠒⠭⢤⠗⣯⣩⣽⣿⠷⣾⣿⢷⣆⠀
#⠜⣌⠢⢄⣀⡀⠀⡞⢡⠘⢄⠑⠨⢉⣀⠉⣀⠄⢊⠜⡸⠛⣿⡍⠉⠉⠈⢁⠁⠇
#⠈⢯⡓⠦⠤⠬⠭⣵⠀⠱⢄⠑⠲⠤⠤⠤⠤⠒⢁⡔⠁⢠⣏⣡⣤⣤⡶⠜⣻⠃
#⠀⠈⠙⠛⠒⠛⠻⠯⠕⠤⣀⣉⣓⣒⣂⣒⣒⣊⣁⣠⠔⠛⠂⠒⠛⠓⠛⠚⠉⠀
import os
import time
import json
import re
import asyncio
import unicodedata
from threading import Thread, Event
from datetime import datetime
from typing import Optional

import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

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

def report_command_to_backend(command_type, message, raw_content, user_info=None, thread_id=None, details=None):
    """Report command/activity to backend for Dashboard with user interaction support. No-op on failure."""
    try:
        requests.post(
            f"{BACKEND_URL}/api/command-logs",
            json={
                "command_type": command_type,
                "message": message,
                "raw_content": raw_content,
                "user_info": user_info,
                "thread_id": thread_id,
                "details": details or {}
            },
            timeout=2,
        )
    except Exception:
        pass

def report_activity_to_backend(messages_sent: int = 0, messages_received: int = 0, commands_used: int = 0):
    """Report message/command activity to backend for Dashboard stats. No-op on failure."""
    try:
        requests.post(
            f"{BACKEND_URL}/api/bot/activity",
            json={
                "messages_sent": messages_sent,
                "messages_received": messages_received,
                "commands_used": commands_used,
            },
            timeout=2,
        )
    except Exception:
        pass


class BotLogger:
    """Logger that sends logs to web dashboard with nice formatting"""
    def __init__(self, api_url: str = None):
        self.api_url = api_url or BACKEND_URL
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
        """Send log to dashboard API. Backend will only store/broadcast/print when logging is ON."""
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
        except Exception:
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
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:238", "message": "ZaloBotRunner.__init__ called", "data": {"imei_provided": imei is not None, "session_cookies_provided": session_cookies is not None}, "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion
        self.api_key = api_key
        self.secret_key = secret_key
        self.imei = imei
        self.session_cookies = session_cookies
        self.bot = None
        self.running = False
        self.start_time = None  # Track when bot actually starts
        self.bot_thread: Optional[Thread] = None
        self.running_event = Event()
        self.bot_thread: Optional[Thread] = None # New: to hold bot listening thread
        self.running_event = Event() # New: to signal bot to stop
        
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
                print(f"[DEBUG] Bot class: {Bot}")
                print(f"[DEBUG] Bot init: {Bot.__init__}")
                self.bot = Bot(
                    self.api_key,
                    self.secret_key,
                    imei=self.imei,
                    session_cookies=normalized_cookies
                )
            
                
                self.running = True
                from datetime import datetime, timezone, timedelta
                gmt7 = timezone(timedelta(hours=7))
                self.start_time = datetime.now(gmt7).isoformat()  # Track actual bot start time
                bot_name = getattr(self.bot, 'me_name', 'Unknown Bot')
                logger.info(f"Bot started successfully: {bot_name}")
                # #region agent log
                with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:289", "message": "Bot instance created and attempting to listen", "data": {"bot_name": bot_name, "start_time": self.start_time}, "timestamp": int(time.time() * 1000)}) + "\n")
                # #endregion
                self.running_event.set() # Signal that the bot should be running
                self.bot_thread = Thread(target=self._run_bot_with_error_handling, daemon=True)
                self.bot_thread.start()

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
                        self.running = False
                        logger.error("Set self.running = False due to startup failure")
                        raise
                else:
                    raise
    
    def _run_bot_with_error_handling(self):
        """Wrapper to catch bot thread crashes and update state"""
        try:
            logger.info("Bot thread started listening")
            self.bot.listen()
            logger.info("Bot listen finished normally")
        except Exception as e:
            logger.error(f"Bot thread crashed: {e}", exc_info=True)
            self.running = False
            logger.info("Set self.running = False due to crash")
            # Use a simple flag for main thread to detect and update bot_state
            # Avoid asyncio calls from thread to prevent event loop issues
            logger.error("Bot thread crashed - UI should update to Stopped on next status check")
    
    def _run_mock_bot(self):
        """Run mock bot for testing without zlapi"""
        self.running = True
        from datetime import datetime, timezone, timedelta
        gmt7 = timezone(timedelta(hours=7))
        self.start_time = datetime.now(gmt7).isoformat()  # Set start time for mock bot
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
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:343", "message": "ZaloBotRunner.stop called", "data": {"self_running": self.running}, "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion
        if self.bot_thread and self.bot_thread.is_alive():
            self.running_event.clear() # Signal the bot to stop
            self.bot_thread.join(timeout=10) # Wait for the thread to finish
            if self.bot_thread.is_alive():
                logger.error("[ERROR] Bot thread did not terminate after 10 seconds.")
                # You might want to add more robust termination logic here, e.g., killing the thread
            else:
                logger.info("Bot thread terminated.")
        self.running = False
        self.start_time = None  # Clear start time when stopped
        logger.info("Bot stopped")
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:361", "message": "ZaloBotRunner.stop completed", "data": {"self_running": self.running}, "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion


bot_runner = None 

def initialize_bot(api_key, secret_key, imei=None, session_cookies=None):
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:368", "message": "initialize_bot function called", "data": {"api_key_provided": api_key is not None}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    """Initialize bot runner"""
    global bot_runner
    new_runner = ZaloBotRunner(api_key, secret_key, imei, session_cookies)
    bot_runner = new_runner
    print(f"[DEBUG] Đã gán bot_runner: {id(bot_runner)}")
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "bot_runner.py:377", "message": "bot_runner initialized", "data": {"bot_runner_id": id(bot_runner)}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    return bot_runner

def start_bot_background():
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "bot_runner.py:346", "message": "start_bot_background called", "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
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
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "bot_runner.py:363", "message": "Bot thread started", "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion
        return True
    except Exception as e:
        print(f"[ERROR] Không thể khởi động thread Bot: {e}")
        return False


def stop_bot():
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "bot_runner.py:370", "message": "stop_bot function called", "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    """Stop the bot"""
    global bot_runner 
    
    if bot_runner:
        bot_runner.stop()
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "bot_runner.py:379", "message": "bot_runner.stop called from stop_bot function", "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion
        return True
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "bot_runner.py:384", "message": "bot_runner is None in stop_bot function", "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    return False


def get_bot_status():
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "D", "location": "bot_runner.py:425", "message": "get_bot_status function called", "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    """Get bot status"""
    global bot_runner 
    
    if bot_runner is None:
        # #region agent log
        with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "D", "location": "bot_runner.py:433", "message": "bot_runner is None in get_bot_status", "timestamp": int(time.time() * 1000)}) + "\n")
        # #endregion
        return {
            "running": False,
            "initialized": False
        }
    
    # #region agent log
    with open(r"c:\Users\duy\Desktop\zalo-bot-integrated\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "D", "location": "bot_runner.py:443", "message": "bot_runner.running status", "data": {"running": bot_runner.running}, "timestamp": int(time.time() * 1000)}) + "\n")
    # #endregion
    return {
        "running": bot_runner.running,
        "initialized": True,
        "mode": "real" if ZLAPI_AVAILABLE else "mock",
        "start_time": bot_runner.start_time  # Return actual bot start time
    }
