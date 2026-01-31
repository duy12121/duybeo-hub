# 🤖 Hướng dẫn tích hợp Bot

## 📝 Tổng quan

File này hướng dẫn cách tích hợp bot Zalo Python của bạn với hệ thống quản trị.

---

## 🔌 Cài đặt

### 1. Copy module vào project bot
```bash
# Copy file bot_client.py vào thư mục bot của bạn
cp bot-integration/bot_client.py /path/to/your/bot/

# Hoặc install dependencies
pip install requests aiohttp
```

### 2. Import vào bot
```python
from bot_client import BotManagerClient

# Initialize (synchronous bot)
bot_manager = BotManagerClient(
    api_url="http://localhost:8000",  # Hoặc URL production
    api_key="your-bot-api-key"
)

# Initialize (async bot)
async with BotManagerClient(api_url="http://localhost:8000") as bot_manager:
    # Your async code here
    pass
```

---

## 📊 Logging Examples

### 1. Basic Logging
```python
# Bot started
bot_manager.info("Zalo bot started successfully")

# Bot stopped
bot_manager.info("Zalo bot stopped")

# User message received
bot_manager.info(
    "Message received",
    details={
        "user_id": "123456789",
        "username": "John Doe",
        "message": "Hello bot!",
        "timestamp": datetime.now().isoformat()
    }
)

# Bot response sent
bot_manager.info(
    "Message sent",
    details={
        "user_id": "123456789",
        "response": "Hi there!",
        "command": "greet"
    }
)
```

### 2. Error Logging
```python
try:
    # Your bot code
    send_message(user_id, message)
except Exception as e:
    bot_manager.error(
        "Failed to send message",
        details={
            "user_id": user_id,
            "error": str(e),
            "error_type": type(e).__name__
        }
    )
```

### 3. Warning Logging
```python
# Rate limit warning
if request_count > rate_limit:
    bot_manager.warning(
        "Rate limit approaching",
        details={
            "current": request_count,
            "limit": rate_limit,
            "user_id": user_id
        }
    )

# Deprecated command used
bot_manager.warning(
    "Deprecated command used",
    details={
        "command": "/oldcmd",
        "user_id": user_id,
        "suggested": "/newcmd"
    }
)
```

### 4. Debug Logging
```python
if DEBUG_MODE:
    bot_manager.debug(
        "Processing command",
        details={
            "command": command,
            "args": args,
            "user_id": user_id
        }
    )
```

---

## 🎯 Complete Bot Example (Synchronous)

```python
"""
Example: Simple Zalo Bot with Management Integration
"""

from bot_client import BotManagerClient
import time
from datetime import datetime

class ZaloBot:
    def __init__(self, api_url="http://localhost:8000", api_key=""):
        self.bot_manager = BotManagerClient(api_url, api_key)
        self.running = False
        self.message_count = 0
        
        # Log bot initialization
        self.bot_manager.info("Zalo Bot initialized")
    
    def start(self):
        """Start the bot"""
        self.running = True
        self.bot_manager.info("Bot started")
        
        try:
            self.run()
        except KeyboardInterrupt:
            self.stop()
        except Exception as e:
            self.bot_manager.error(
                "Bot crashed",
                details={"error": str(e)}
            )
            raise
    
    def stop(self):
        """Stop the bot"""
        self.running = False
        self.bot_manager.info(
            "Bot stopped",
            details={"total_messages": self.message_count}
        )
    
    def run(self):
        """Main bot loop"""
        while self.running:
            try:
                # Get messages from Zalo (your implementation)
                messages = self.get_messages()
                
                for msg in messages:
                    self.handle_message(msg)
                
                time.sleep(1)
                
            except Exception as e:
                self.bot_manager.error(
                    "Error in main loop",
                    details={"error": str(e)}
                )
                time.sleep(5)  # Wait before retry
    
    def handle_message(self, message):
        """Handle incoming message"""
        user_id = message.get('user_id')
        text = message.get('text', '')
        
        # Log received message
        self.bot_manager.info(
            "Message received",
            details={
                "user_id": user_id,
                "message": text,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        # Check if it's a command
        if text.startswith('/'):
            response = self.handle_command(user_id, text)
        else:
            response = self.handle_text(user_id, text)
        
        # Send response
        self.send_message(user_id, response)
        self.message_count += 1
    
    def handle_command(self, user_id, command):
        """Handle bot commands"""
        cmd = command.split()[0].lower()
        
        self.bot_manager.info(
            f"Command executed: {cmd}",
            details={"user_id": user_id, "command": command}
        )
        
        if cmd == '/start':
            return "Welcome to Zalo Bot! 🤖"
        elif cmd == '/help':
            return "Available commands: /start, /help, /ping"
        elif cmd == '/ping':
            return "Pong! 🏓"
        else:
            self.bot_manager.warning(
                "Unknown command",
                details={"user_id": user_id, "command": cmd}
            )
            return f"Unknown command: {cmd}"
    
    def handle_text(self, user_id, text):
        """Handle regular text messages"""
        # Your AI/logic here
        response = f"You said: {text}"
        return response
    
    def send_message(self, user_id, text):
        """Send message to user"""
        try:
            # Your Zalo API call here
            # zalo_api.send_message(user_id, text)
            
            self.bot_manager.info(
                "Message sent",
                details={
                    "user_id": user_id,
                    "message": text
                }
            )
            
        except Exception as e:
            self.bot_manager.error(
                "Failed to send message",
                details={
                    "user_id": user_id,
                    "error": str(e)
                }
            )
            raise
    
    def get_messages(self):
        """Get messages from Zalo (placeholder)"""
        # Your implementation to get messages from Zalo
        return []


# Run bot
if __name__ == "__main__":
    bot = ZaloBot(
        api_url="http://localhost:8000",
        api_key="your-bot-api-key"
    )
    bot.start()
```

---

## 🚀 Complete Bot Example (Asynchronous)

```python
"""
Example: Async Zalo Bot with Management Integration
"""

import asyncio
from bot_client import BotManagerClient
from datetime import datetime

class AsyncZaloBot:
    def __init__(self, api_url="http://localhost:8000", api_key=""):
        self.api_url = api_url
        self.api_key = api_key
        self.bot_manager = None
        self.running = False
        self.message_count = 0
    
    async def start(self):
        """Start the bot"""
        async with BotManagerClient(self.api_url, self.api_key) as bot_manager:
            self.bot_manager = bot_manager
            self.running = True
            
            await self.bot_manager.info_async("Async bot started")
            
            try:
                await self.run()
            except KeyboardInterrupt:
                await self.stop()
            except Exception as e:
                await self.bot_manager.error_async(
                    "Bot crashed",
                    details={"error": str(e)}
                )
                raise
    
    async def stop(self):
        """Stop the bot"""
        self.running = False
        if self.bot_manager:
            await self.bot_manager.info_async(
                "Bot stopped",
                details={"total_messages": self.message_count}
            )
    
    async def run(self):
        """Main bot loop"""
        while self.running:
            try:
                # Get messages from Zalo
                messages = await self.get_messages()
                
                # Process messages concurrently
                tasks = [self.handle_message(msg) for msg in messages]
                await asyncio.gather(*tasks)
                
                await asyncio.sleep(1)
                
            except Exception as e:
                await self.bot_manager.error_async(
                    "Error in main loop",
                    details={"error": str(e)}
                )
                await asyncio.sleep(5)
    
    async def handle_message(self, message):
        """Handle incoming message"""
        user_id = message.get('user_id')
        text = message.get('text', '')
        
        await self.bot_manager.info_async(
            "Message received",
            details={
                "user_id": user_id,
                "message": text,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        if text.startswith('/'):
            response = await self.handle_command(user_id, text)
        else:
            response = await self.handle_text(user_id, text)
        
        await self.send_message(user_id, response)
        self.message_count += 1
    
    async def handle_command(self, user_id, command):
        """Handle bot commands"""
        cmd = command.split()[0].lower()
        
        await self.bot_manager.info_async(
            f"Command executed: {cmd}",
            details={"user_id": user_id, "command": command}
        )
        
        commands = {
            '/start': "Welcome to Async Zalo Bot! 🚀",
            '/help': "Available commands: /start, /help, /ping",
            '/ping': "Pong! 🏓"
        }
        
        if cmd in commands:
            return commands[cmd]
        else:
            await self.bot_manager.warning_async(
                "Unknown command",
                details={"user_id": user_id, "command": cmd}
            )
            return f"Unknown command: {cmd}"
    
    async def handle_text(self, user_id, text):
        """Handle regular text"""
        # Your async AI/logic here
        return f"You said: {text}"
    
    async def send_message(self, user_id, text):
        """Send message to user"""
        try:
            # Your async Zalo API call here
            # await zalo_api.send_message(user_id, text)
            
            await self.bot_manager.info_async(
                "Message sent",
                details={"user_id": user_id, "message": text}
            )
            
        except Exception as e:
            await self.bot_manager.error_async(
                "Failed to send message",
                details={"user_id": user_id, "error": str(e)}
            )
            raise
    
    async def get_messages(self):
        """Get messages from Zalo"""
        # Your async implementation
        return []


# Run async bot
if __name__ == "__main__":
    bot = AsyncZaloBot(
        api_url="http://localhost:8000",
        api_key="your-bot-api-key"
    )
    asyncio.run(bot.start())
```

---

## 🎨 Best Practices

### 1. Structured Logging
```python
# Good: Structured with details
bot_manager.info(
    "User action",
    details={
        "action": "purchase",
        "user_id": "123",
        "amount": 50000,
        "item": "Premium Pack"
    }
)

# Bad: Unstructured
bot_manager.info("User 123 purchased Premium Pack for 50000")
```

### 2. Error Context
```python
# Good: Include context
try:
    process_payment(user_id, amount)
except Exception as e:
    bot_manager.error(
        "Payment processing failed",
        details={
            "user_id": user_id,
            "amount": amount,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
    )

# Bad: No context
except Exception as e:
    bot_manager.error(str(e))
```

### 3. Performance Monitoring
```python
import time

start = time.time()
# Your operation
duration = time.time() - start

if duration > 5:  # Slow operation
    bot_manager.warning(
        "Slow operation detected",
        details={
            "operation": "database_query",
            "duration": duration,
            "threshold": 5
        }
    )
```

---

## 📊 Production Tips

1. **Use environment variables:**
   ```python
   import os
   
   bot_manager = BotManagerClient(
       api_url=os.getenv('BOT_API_URL', 'http://localhost:8000'),
       api_key=os.getenv('BOT_API_KEY', '')
   )
   ```

2. **Implement retry logic:**
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
   def send_log(message, details):
       bot_manager.info(message, details)
   ```

3. **Batch logging for high-traffic:**
   ```python
   log_queue = []
   
   def queue_log(level, message, details):
       log_queue.append({
           'level': level,
           'message': message,
           'details': details
       })
       
       if len(log_queue) >= 10:  # Send batch
           flush_logs()
   
   def flush_logs():
       # Send all logs at once
       for log in log_queue:
           bot_manager.log(log['level'], log['message'], log['details'])
       log_queue.clear()
   ```

---

## 🔍 Debugging

### Check connection:
```python
try:
    bot_manager.info("Connection test")
    print("✅ Connected successfully!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

### Verify API key:
```bash
# Test with curl
curl -X POST http://localhost:8000/api/logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-bot-api-key" \
  -d '{"level":"INFO","message":"Test from curl"}'
```

---

Happy Bot Building! 🤖✨
