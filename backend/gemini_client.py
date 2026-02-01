"""
Gemini AI client with API key rotation and auto-relogin support.

Features:
- Multiple API keys with round-robin rotation
- Automatic retry on 429 rate limit errors
- Auto-relogin with cookies mechanism
- Client singleton for performance
"""

import os
import logging
import time
import json
import asyncio
from typing import List, Optional, Dict, Any
from threading import Lock

try:
    from google import genai
except Exception:
    genai = None

logger = logging.getLogger(__name__)

# Default model for text generation (Gemini 2.5 Flash)
DEFAULT_MODEL = "gemini-2.5-flash"

# API key rotation state
_api_keys: List[str] = []
_current_key_index = 0
_key_rotation_lock = Lock()
_failed_keys: Dict[str, float] = {}  # key -> timestamp when it failed
_retry_cooldown = 60  # seconds to wait before retrying a failed key

# Client instances for each key
_clients: Dict[str, Any] = {}

# Auto-relogin state
_last_relogin_attempt = 0
_relogin_cooldown = 300  # 5 minutes between relogin attempts


def _initialize_api_keys():
    """Initialize API keys from environment variable GEMINI_KEYS."""
    global _api_keys
    keys_string = os.environ.get("GEMINI_KEYS", "")
    if not keys_string:
        raise RuntimeError("GEMINI_KEYS not set in environment. Format: 'key1,key2,key3'")
    
    _api_keys = [key.strip() for key in keys_string.split(",") if key.strip()]
    if not _api_keys:
        raise RuntimeError("No valid API keys found in GEMINI_KEYS")
    
    logger.info(f"Initialized {len(_api_keys)} Gemini API keys for rotation")


def _get_next_available_key() -> Optional[str]:
    """Get next available API key using round-robin with failed key tracking."""
    global _current_key_index
    
    if not _api_keys:
        _initialize_api_keys()
    
    now = time.time()
    attempts = 0
    
    while attempts < len(_api_keys):
        key = _api_keys[_current_key_index]
        _current_key_index = (_current_key_index + 1) % len(_api_keys)
        
        # Skip keys that are in cooldown
        if key not in _failed_keys or (now - _failed_keys[key]) > _retry_cooldown:
            return key
        
        attempts += 1
    
    # All keys are in cooldown, return the first one anyway
    logger.warning("All API keys are in cooldown, using first key anyway")
    return _api_keys[0]


def _mark_key_failed(key: str):
    """Mark a key as failed due to rate limit or other errors."""
    _failed_keys[key] = time.time()
    logger.warning(f"Marked API key as failed: {key[:8]}... (cooldown: {_retry_cooldown}s)")


def _get_client_for_key(key: str):
    """Get or create client for specific API key."""
    if key not in _clients:
        if genai is None:
            raise RuntimeError("google-genai package is not installed (pip install google-genai)")
        _clients[key] = genai.Client(api_key=key)
        logger.info(f"Created new Gemini client for key: {key[:8]}...")
    
    return _clients[key]


def _perform_auto_relogin() -> bool:
    """Attempt to relogin using stored cookies."""
    global _last_relogin_attempt
    
    now = time.time()
    if (now - _last_relogin_attempt) < _relogin_cooldown:
        logger.info("Relogin attempt too recent, skipping")
        return False
    
    _last_relogin_attempt = now
    
    try:
        # Get Zalo credentials from environment
        zalo_api_key = os.environ.get("ZALO_API_KEY")
        zalo_secret_key = os.environ.get("ZALO_SECRET_KEY")
        zalo_imei = os.environ.get("ZALO_IMEI")
        zalo_cookies_str = os.environ.get("ZALO_COOKIES", "{}")
        
        if not all([zalo_api_key, zalo_secret_key, zalo_imei]):
            logger.warning("Missing Zalo credentials for auto-relogin")
            return False
        
        try:
            zalo_cookies = json.loads(zalo_cookies_str)
        except json.JSONDecodeError:
            logger.error("Invalid ZALO_COOKIES format")
            return False
        
        # Import bot_runner for relogin
        try:
            import bot_runner
            
            # Reinitialize bot with existing cookies
            if hasattr(bot_runner, 'initialize_bot') and hasattr(bot_runner, 'bot_runner'):
                bot_runner.initialize_bot(
                    zalo_api_key,
                    zalo_secret_key,
                    zalo_imei,
                    zalo_cookies
                )
                
                # Restart bot if it was running
                if hasattr(bot_runner, 'bot_runner') and bot_runner.bot_runner:
                    try:
                        bot_runner.bot_runner.stop_bot()
                        # Start bot in background
                        import threading
                        threading.Thread(target=bot_runner.bot_runner.start_bot_background, daemon=True).start()
                        
                        logger.info("Auto-relogin successful: Bot reinitialized and restarted")
                        return True
                    except Exception as e:
                        logger.error(f"Failed to restart bot after relogin: {e}")
                        return False
                else:
                    logger.info("Auto-relogin successful: Bot reinitialized")
                    return True
                    
        except ImportError:
            logger.error("bot_runner module not available for auto-relogin")
            return False
            
    except Exception as e:
        logger.error(f"Auto-relogin failed: {e}")
        return False


def generate_content(prompt: str, model_name: str | None = None, max_retries: int = 3) -> str:
    """Generate text from Gemini with API key rotation and retry mechanism.
    
    Args:
        prompt: The input prompt
        model_name: Optional model name (defaults to gemini-2.5-flash)
        max_retries: Maximum number of retries across different keys
        
    Returns:
        Generated text response
        
    Raises:
        RuntimeError: If all API keys fail or no keys are available
    """
    if genai is None:
        raise RuntimeError("google-genai package is not installed (pip install google-genai)")
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            with _key_rotation_lock:
                key = _get_next_available_key()
                if not key:
                    raise RuntimeError("No available API keys")
                
                client = _get_client_for_key(key)
            
            # System instruction để AI có cá tính lầy lội
            system_instruction = """
            Mày là trợ lý của duybeo, một thằng nghiện game. Cách nói chuyện của mày phải lầy lội, thỉnh thoảng cà khịa nhưng vẫn phải giải quyết được việc. 
            Nếu ai hỏi về duybeo thì cứ bảo nó đang bận 'lọ' hoặc đi chơi với gái.
            Mày có thể chửi thề nhẹ nhàng, dùng meme, nói chuyện thân mật như bạn bè.
            Tránh trả lời quá trang trọng, phải có chút hài hước và troll.
            """
            
            response = client.models.generate_content(
                model=model_name or DEFAULT_MODEL,
                contents=prompt,
                config=genai.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            )
            
            if response and getattr(response, "text", None):
                return response.text.strip()
            return str(response) if response else ""
            
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # Check for rate limit errors (429 or similar)
            if "429" in error_str or "rate limit" in error_str or "quota" in error_str:
                logger.warning(f"Rate limit hit for key {key[:8]}...: {e}")
                _mark_key_failed(key)
                
                # Try auto-relogin if this is a Zalo-related request
                if "zalo" in prompt.lower() or "duybeo" in prompt.lower():
                    logger.info("Attempting auto-relogin due to rate limit on Zalo-related request")
                    asyncio.create_task(asyncio.to_thread(_perform_auto_relogin))
                
                # Wait a bit before retrying with next key
                if attempt < max_retries - 1:
                    time.sleep(1)
                continue
            
            # For other errors, don't mark key as failed but log it
            logger.error(f"Gemini API error with key {key[:8]}...: {e}")
            
            # If it's the last attempt, raise the error
            if attempt == max_retries - 1:
                break
    
    # All retries failed
    logger.error(f"All Gemini API keys failed after {max_retries} attempts. Last error: {last_error}")
    raise RuntimeError(f"All Gemini API keys failed. Last error: {last_error}")


def get_api_key_status() -> Dict[str, Any]:
    """Get status of all API keys for monitoring."""
    now = time.time()
    status = {
        "total_keys": len(_api_keys),
        "available_keys": 0,
        "failed_keys": 0,
        "current_index": _current_key_index,
        "keys": []
    }
    
    for i, key in enumerate(_api_keys):
        is_failed = key in _failed_keys and (now - _failed_keys[key]) <= _retry_cooldown
        key_status = {
            "index": i,
            "key_preview": f"{key[:8]}...",
            "is_failed": is_failed,
            "failed_at": _failed_keys.get(key, None),
            "cooldown_remaining": max(0, _retry_cooldown - (now - _failed_keys.get(key, 0))) if is_failed else 0
        }
        
        if is_failed:
            status["failed_keys"] += 1
        else:
            status["available_keys"] += 1
            
        status["keys"].append(key_status)
    
    return status


def reset_failed_keys():
    """Reset all failed keys (useful for manual intervention)."""
    global _failed_keys
    _failed_keys.clear()
    logger.info("Reset all failed API keys")


# Initialize API keys on module import
try:
    _initialize_api_keys()
except Exception as e:
    logger.warning(f"Failed to initialize API keys on import: {e}")
