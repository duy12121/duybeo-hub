import { useState, useEffect, useRef, memo } from 'react';
import { MessageCircle, Users, Send, X, User, Shield, Crown, Clock } from 'lucide-react';
import { chatAPI } from '../services/api';

const AdminChatPanel = memo(({ currentUser, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'mod'
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadChatSessions();
      
      // Setup WebSocket for real-time messages
      const wsBase = (import.meta.env.VITE_WS_URL || '').replace(/\/+$/, '') ||
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
      const ws = new WebSocket(`${wsBase}/ws/chat`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_chat_message') {
          handleNewMessage(data.message);
        } else if (data.type === 'new_chat_session') {
          loadChatSessions();
        }
      };

      return () => ws.close();
    }
  }, [isOpen]);

  const loadChatSessions = async () => {
    try {
      const response = await chatAPI.getAdminSessions({
        targetType: activeTab === 'admin' ? 'admin' : 'moderator'
      });
      setChatSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadChatSessions();
    }
  }, [activeTab, isOpen]);

  const handleNewMessage = (newMessage) => {
    if (activeSession && activeSession.id === newMessage.sessionId) {
      setActiveSession(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }));
    } else {
      loadChatSessions();
    }
  };

  const selectSession = async (session) => {
    try {
      const response = await chatAPI.getSessionMessages(session.id);
      setActiveSession({
        ...session,
        messages: response.data.messages || []
      });
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      sender: currentUser,
      timestamp: new Date(),
      type: 'admin'
    };

    setActiveSession(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
    setMessage('');
    setIsTyping(true);

    try {
      await chatAPI.sendAdminMessage({
        sessionId: activeSession.id,
        content: message,
        senderType: currentUser.role
      });
      setIsTyping(false);
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
  }, [activeSession?.messages]);

  const formatSessionTime = (timestamp) => {
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffMs = now - sessionTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return `${Math.floor(diffMins / 1440)} ngày trước`;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const lastActivity = new Date(session.lastActivity || session.createdAt);
    const diffMs = now - lastActivity;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return { text: 'Đang hoạt động', color: 'text-green-400' };
    if (diffMins < 20) return { text: 'Ít hoạt động', color: 'text-yellow-400' };
    return { text: 'Sắp hết hạn', color: 'text-red-400' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col">
        {/* Header */}
        <div className="bg-dark-900 rounded-t-xl p-4 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Quản lý Chat Người dùng</h3>
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
                  ? 'bg-red-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Crown className="w-4 h-4" />
              Chat Admin ({chatSessions.filter(s => s.targetType === 'admin').length})
            </button>
            <button
              onClick={() => setActiveTab('mod')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'mod'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              Chat Mod ({chatSessions.filter(s => s.targetType === 'moderator').length})
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sessions List */}
          <div className="w-80 border-r border-dark-700 overflow-y-auto">
            <div className="p-3">
              <h4 className="text-sm font-medium text-dark-300 mb-3">Phiên chat đang hoạt động</h4>
              <div className="space-y-2">
                {chatSessions
                  .filter(session => session.targetType === (activeTab === 'admin' ? 'admin' : 'moderator'))
                  .map((session) => {
                    const status = getSessionStatus(session);
                    const isActive = activeSession?.id === session.id;
                    
                    return (
                      <div
                        key={session.id}
                        onClick={() => selectSession(session)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-700 hover:bg-dark-600 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{session.username}</span>
                            {session.fullName && (
                              <span className="text-xs opacity-70">({session.fullName})</span>
                            )}
                          </div>
                          <span className={`text-xs ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatSessionTime(session.createdAt)}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {session.userRole} • {session.messages?.length || 0} tin nhắn
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {chatSessions.filter(session => session.targetType === (activeTab === 'admin' ? 'admin' : 'moderator')).length === 0 && (
                <p className="text-dark-400 text-center py-4">Chưa có phiên chat nào</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-dark-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary-400" />
                      <div>
                        <h4 className="font-medium text-white">{activeSession.username}</h4>
                        <p className="text-sm text-dark-400">
                          {activeSession.fullName} • {activeSession.userRole}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      getSessionStatus(activeSession).color
                    } bg-dark-700`}>
                      {getSessionStatus(activeSession).text}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeSession.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          msg.type === 'admin'
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-700 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
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
                    <div className="flex justify-end">
                      <div className="bg-primary-600 text-white px-4 py-2 rounded-lg">
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
                      placeholder="Nhập phản hồi..."
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                  <p className="text-dark-400">Chọn một phiên chat để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

AdminChatPanel.displayName = 'AdminChatPanel';

export default AdminChatPanel;
