import { useState, useEffect, useRef, memo } from 'react';
import { MessageCircle, Send, X, User, Shield, Crown } from 'lucide-react';
import { chatAPI } from '../services/api';

const ChatWithAdmin = memo(({ currentUser, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'mod'
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // WebSocket for receiving admin replies
  useEffect(() => {
    if (!isOpen || !activeSessionId) return;

    const wsBase = (import.meta.env.VITE_WS_URL || '').replace(/\/+$/, '') ||
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws/chat`);

    ws.onopen = () => {
      console.log('🔔 Hữu duyên tương ngộ, WebSocket chat đã kết nối.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'admin_reply' && data.sessionId === activeSessionId && data.message) {
          setMessages((prev) => [...prev, data.message]);
          setIsTyping(false);
        }
      } catch (e) {
        console.error('Failed to parse chat ws message:', e);
      }
    };

    ws.onerror = (e) => {
      console.error('Chat WebSocket error:', e);
      console.log('⚠️ Nghiệp chưa đủ sâu, WebSocket chat tạm thời im lặng.');
    };

    ws.onclose = () => {
      console.log('🌑 Nhân duyên đã tận, WebSocket chat rời xa...');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('🧘‍♂️ Tĩnh tâm chờ đợi, duyên chat sẽ lại về.');
      }, 3000);
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [isOpen, activeSessionId]);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !activeSessionId) {
      initializeChat();
    }
  }, [isOpen]);

  // Auto cleanup after 20 minutes
  useEffect(() => {
    const cleanupTimer = setTimeout(() => {
      if (activeSessionId) {
        cleanupChat();
      }
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearTimeout(cleanupTimer);
  }, [activeSessionId]);

  // Cleanup on page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSessionId) {
        navigator.sendBeacon('/api/chat/cleanup', JSON.stringify({ sessionId: activeSessionId }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSessionId]);

  const initializeChat = async () => {
    try {
      const response = await chatAPI.createSession({
        userType: currentUser.role,
        userId: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.full_name
      });
      
      setActiveSessionId(response.data.sessionId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const cleanupChat = async () => {
    if (activeSessionId) {
      try {
        await chatAPI.cleanupSession(activeSessionId);
      } catch (error) {
        console.error('Failed to cleanup chat:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSessionId) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      sender: currentUser,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage({
        sessionId: activeSessionId,
        content: message,
        targetType: activeTab === 'admin' ? 'admin' : 'moderator'
      });

      // Add admin/moderator response
      if (response.data.reply) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            content: response.data.reply,
            sender: {
              username: activeTab === 'admin' ? 'Quản trị viên' : 'Kiểm duyệt viên',
              role: activeTab === 'admin' ? 'admin' : 'moderator'
            },
            timestamp: new Date(),
            type: 'admin'
          }]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-dark-900 rounded-t-xl p-4 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Chat với Quản trị viên</h3>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'admin'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Crown className="w-4 h-4" />
              Chat với Admin
            </button>
            <button
              onClick={() => setActiveTab('mod')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'mod'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              Chat với Mod
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {msg.sender.username}
                  </span>
                  {msg.sender.role && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      msg.sender.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {msg.sender.role === 'admin' ? 'Admin' : 'Mod'}
                    </span>
                  )}
                </div>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-dark-700 text-white px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-dark-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isTyping}
              className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWithAdmin.displayName = 'ChatWithAdmin';

export default ChatWithAdmin;
