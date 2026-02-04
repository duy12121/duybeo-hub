import asyncio
import random
import gc
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_database

class AIHandler:
    def __init__(self):
        self.fallback_responses = [
            "xin lỗi, hiện tại tôi đang bị rớt lão",
            "thông cảm, hiện tại tôi đang được giải ngố", 
            "thông cảm, hiện tại tôi đang bị thay dầu nhớt",
            "xin lỗi nhé, hiện tại tôi đang bận đi chơi với gái"
        ]
        
        self.web_responses = {
            "web này để làm gì": "web này để quản trị/xem bot của duybeo",
            "chủ web là ai": "chủ web là duybeo, một thằng nghiện game"
        }
        
        # Memory optimization: limit cache size
        self.max_cache_size = 100
        self.cooldown = {}    # {thread_id: last_message_time}
        self.message_count = {}  # {thread_id: count}
        
        # Memory dictionaries for fallback (when MongoDB is not available)
        self.web_memory = {}    # {thread_id: [messages]}
        self.zalo_memory = {}  # {thread_id: [messages]}

    def _cleanup_old_cache(self):
        """Clean up old cache entries to prevent memory leaks"""
        try:
            # Clean cooldown cache
            now = asyncio.get_event_loop().time()
            expired_cooldown = [
                thread_id for thread_id, last_time in self.cooldown.items()
                if now - last_time > 300  # 5 minutes
            ]
            for thread_id in expired_cooldown:
                del self.cooldown[thread_id]
                if thread_id in self.message_count:
                    del self.message_count[thread_id]
            
            # Clean memory cache if too large
            if len(self.web_memory) > self.max_cache_size:
                # Remove oldest 20% entries
                to_remove = len(self.web_memory) // 5
                for thread_id in list(self.web_memory.keys())[:to_remove]:
                    del self.web_memory[thread_id]
            
            if len(self.zalo_memory) > self.max_cache_size:
                to_remove = len(self.zalo_memory) // 5
                for thread_id in list(self.zalo_memory.keys())[:to_remove]:
                    del self.zalo_memory[thread_id]
            
            # Force garbage collection
            gc.collect()
            
        except Exception as e:
            print(f"[AI_CACHE_ERROR] Failed to cleanup cache: {e}")

    async def get_ai_response(self, message: str, thread_id: str = None, is_web: bool = False) -> str:
        """Get AI response with timeout and fallback handling"""
        try:
            # Periodic cleanup
            if random.random() < 0.1:  # 10% chance to cleanup
                self._cleanup_old_cache()
            
            # Check cooldown (1 minute, 15 questions)
            if self._is_in_cooldown(thread_id):
                return "xin lỗi, hiện tại tôi đang được reset não, vui lòng chờ tôi ít phút"
            
            # Update message count
            self._update_message_count(thread_id)
            
            # Check if it's a web-specific question
            if is_web:
                web_response = self._get_web_response(message)
                if web_response:
                    return web_response
            
            # Try to get AI response with timeout
            try:
                # Here you would call your actual AI service (Gemini, etc.)
                response = await asyncio.wait_for(
                    self._call_ai_service(message, thread_id, is_web),
                    timeout=10.0  # Reduced from 15s to save memory
                )
                
                # Update memory (async but don't wait to save time)
                asyncio.create_task(self._update_memory(message, response, thread_id, is_web))
                
                return response
                
            except asyncio.TimeoutError:
                # AI took too long, send fallback
                fallback = random.choice(self.fallback_responses)
                
                # Log the timeout
                print(f"[AI_TIMEOUT] Thread {thread_id}: {message}")
                
                # If under 10s, try to send partial response
                if not is_web:  # Only for Zalo bot
                    await self._send_partial_response(thread_id, fallback)
                
                return fallback
                
        except Exception as e:
            print(f"[AI_ERROR] {e}")
            return random.choice(self.fallback_responses)

    async def _call_ai_service(self, message: str, thread_id: str = None, is_web: bool = False) -> str:
        """Call actual AI service (Gemini, etc.)"""
        # This is where you would integrate with your actual AI service
        # For now, return a placeholder
        await asyncio.sleep(0.3)  # Reduced from 0.5s to save memory
        
        # Simple response generation (replace with actual AI call)
        message_lower = message.lower()
        if "hello" in message_lower:
            return "Hello! How can I help you today?"
        elif "how are you" in message_lower:
            return "Tôi đang hoạt động tốt, cảm ơn bạn đã hỏi!"
        else:
            # Generate more contextual responses
            if "help" in message_lower or "hỗ trợ" in message_lower:
                return "Tôi có thể giúp bạn tìm thông tin hoặc trả lời câu hỏi. Bạn cần hỗ trợ gì?"
            elif "hello" in message_lower or "chào" in message_lower:
                return "Xin chào! Tôi là trợ lý AI, rất vui được hỗ trợ bạn."
            elif "thanks" in message_lower or "cảm ơn" in message_lower:
                return "Rất vui vì đã giúp được bạn! Cần hỗ trợ thêm gì không?"
            else:
                return "Tôi hiểu tin nhắn của bạn. Hãy để tôi giúp đỡ nhé."

    async def _send_partial_response(self, thread_id: str, message: str):
        """Send partial response to Zalo before timeout"""
        try:
            # Here you would send the partial response to Zalo
            # This prevents Zalo from skipping the message
            print(f"[PARTIAL_RESPONSE] Thread {thread_id}: {message}")
            # await zalo_api.send_message(thread_id, "...")
        except Exception as e:
            print(f"[PARTIAL_ERROR] {e}")

    def _get_web_response(self, message: str) -> Optional[str]:
        """Get predefined response for web questions"""
        message_lower = message.lower().strip()
        return self.web_responses.get(message_lower)

    async def _update_memory(self, user_message: str, ai_response: str, thread_id: str, is_web: bool):
        """Update conversation memory in MongoDB"""
        try:
            db = await get_database()
            collection_name = "web_chat_history" if is_web else "zalo_chat_history"
            max_messages = 1 if is_web else 2  # Reduced memory usage
            
            # Get current memory
            memory_doc = await db[collection_name].find_one({"thread_id": thread_id})
            
            if not memory_doc:
                memory_doc = {
                    "thread_id": thread_id,
                    "messages": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            
            # Add new message
            memory_doc["messages"].append({
                "user": user_message[:200],  # Limit message length
                "ai": ai_response[:200],     # Limit message length
                "timestamp": datetime.utcnow()
            })
            
            # Keep only last N messages
            if len(memory_doc["messages"]) > max_messages:
                memory_doc["messages"] = memory_doc["messages"][-max_messages:]
            
            memory_doc["updated_at"] = datetime.utcnow()
            
            # Save to MongoDB
            await db[collection_name].update_one(
                {"thread_id": thread_id},
                {"$set": memory_doc},
                upsert=True
            )
            
        except Exception as e:
            print(f"[AI_MEMORY_ERROR] Failed to save memory: {e}")
            # Fallback to local memory (limited)
            memory = self.web_memory if is_web else self.zalo_memory
            if thread_id not in memory:
                memory[thread_id] = []
            memory[thread_id].append({
                "user": user_message[:200],
                "ai": ai_response[:200],
                "timestamp": datetime.utcnow()
            })
            # Keep only last N messages
            max_messages = 1 if is_web else 2
            if len(memory[thread_id]) > max_messages:
                memory[thread_id] = memory[thread_id][-max_messages:]

    async def get_memory_context(self, thread_id: str, is_web: bool = False) -> List[dict]:
        """Get conversation memory from MongoDB for context"""
        try:
            db = await get_database()
            collection_name = "web_chat_history" if is_web else "zalo_chat_history"
            
            memory_doc = await db[collection_name].find_one({"thread_id": thread_id})
            
            if memory_doc and "messages" in memory_doc:
                return memory_doc["messages"]
            
            return []
            
        except Exception as e:
            print(f"[AI_MEMORY_ERROR] Failed to get memory: {e}")
            # Fallback to local memory
            memory = self.web_memory if is_web else self.zalo_memory
            return memory.get(thread_id, [])

    async def clear_memory(self, thread_id: str, is_web: bool = False):
        """Clear memory for a specific thread in MongoDB"""
        try:
            db = await get_database()
            collection_name = "web_chat_history" if is_web else "zalo_chat_history"
            
            await db[collection_name].delete_one({"thread_id": thread_id})
            
            # Also clear from local memory
            memory = self.web_memory if is_web else self.zalo_memory
            if thread_id in memory:
                del memory[thread_id]
            
        except Exception as e:
            print(f"[AI_MEMORY_ERROR] Failed to clear memory: {e}")
            # Fallback to local memory
            memory = self.web_memory if is_web else self.zalo_memory
            if thread_id in memory:
                del memory[thread_id]

    def _is_in_cooldown(self, thread_id: str) -> bool:
        """Check if thread is in cooldown period"""
        if not thread_id:
            return False
            
        now = asyncio.get_event_loop().time()
        last_time = self.cooldown.get(thread_id, 0)
        message_count = self.message_count.get(thread_id, 0)
        
        # 1 minute cooldown after 10 messages (reduced from 15)
        if message_count >= 10 and (now - last_time) < 60:
            return True
        
        # Reset cooldown if enough time passed
        if message_count >= 10 and (now - last_time) >= 60:
            self.message_count[thread_id] = 0
            return False
            
        return False

    def _update_message_count(self, thread_id: str):
        """Update message count and last message time"""
        if not thread_id:
            return
            
        now = asyncio.get_event_loop().time()
        self.cooldown[thread_id] = now
        self.message_count[thread_id] = self.message_count.get(thread_id, 0) + 1

# Global AI handler instance
ai_handler = AIHandler()
