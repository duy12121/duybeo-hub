import { useState, useEffect, useRef, memo } from 'react';
import { dashboardAPI, botAPI, settingsAPI, chatAPI, authAPI } from '../services/api';
import { Activity, Users, MessageSquare, Command, Play, Square, RotateCw, User, Code, MessageCircle, MessageCircleIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { connectWebSocket } from '../services/websocket';
import UserProfileModal from '../components/UserProfileModal';
import ChatWithAdmin from '../components/ChatWithAdmin';
import AdminChatPanel from '../components/AdminChatPanel';

const StatCard = memo(({ icon, label, value, color, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div 
      className="card p-6 relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
      <div className="text-sm text-dark-400 font-medium">{label}</div>
      
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-dark-900 border border-dark-600 rounded-lg shadow-xl z-10 w-64">
          {tooltip}
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

const Dashboard = memo(() => {
  const [stats, setStats] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [localUptime, setLocalUptime] = useState(0);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [commandLogs, setCommandLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showChatWithAdmin, setShowChatWithAdmin] = useState(false);
  const [showAdminChatPanel, setShowAdminChatPanel] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeLogTab, setActiveLogTab] = useState('logs');
  const wsRef = useRef(null);

  useEffect(() => {
    loadData();
    loadCommandLogs();
    loadCurrentUser();
    settingsAPI.getLoggingStatus().then((r) => setLoggingEnabled(!!r.data?.enabled)).catch(() => {});
    
    const setupWebSocket = async () => {
      try {
        wsRef.current = connectWebSocket((message) => {
          // Use useCallback pattern for better performance
          if (message.type === 'dashboard_stats' && message.data) {
            setStats(message.data);
          } else if (message.type === 'bot_status' && message.data) {
            setBotStatus(message.data);
          } else if (message.type === 'command_log' && message.data) {
            // Limit logs to 50 items for performance
            setCommandLogs(prev => {
              const newLogs = [message.data, ...prev];
              return newLogs.length > 50 ? newLogs.slice(0, 50) : newLogs;
            });
          }
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };
    
    setupWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Real-time uptime counter - only runs when bot is running
  useEffect(() => {
    let interval;
    if (botStatus?.is_running) {
      // Set initial uptime from server
      setLocalUptime(stats?.bot_uptime || 0);
      // Start counting every second
      interval = setInterval(() => {
        setLocalUptime(prev => prev + 1);
      }, 1000);
    } else {
      // Reset to 0 when bot is stopped
      setLocalUptime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [botStatus?.is_running, stats?.bot_uptime]);

  const loadData = async () => {
    try {
      const [statsRes, statusRes] = await Promise.all([
        dashboardAPI.getStats(),
        botAPI.getStatus()
      ]);
      setStats(statsRes.data);
      setBotStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommandLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/command-logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommandLogs(data);
      }
    } catch (error) {
      console.error('Failed to load command logs:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const handleUserClick = (userInfo) => {
    if (userInfo && userInfo.user_id) {
      setSelectedUser(userInfo.user_id);
      setShowUserProfile(true);
    }
  };

  const handleLoggingToggle = async () => {
    const next = !loggingEnabled;
    try {
      await settingsAPI.setLoggingStatus(next);
      setLoggingEnabled(next);
    } catch (error) {
      console.error('Failed to toggle logging:', error);
      alert('Lỗi: Không thể thay đổi cấu hình logging');
    }
  };

  const handleBotControl = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'start') await botAPI.start();
      else if (action === 'stop') await botAPI.stop();
      else if (action === 'restart') await botAPI.restart();
      await loadData();
    } catch (error) {
      console.error(`Failed to ${action} bot:`, error);
      const detail = error.response?.data?.detail;
      if (error.response?.status === 403) {
        alert('Bạn không có quyền thực hiện thao tác này. Cần quyền CONTROL_BOT.');
      } else if (error.response?.status === 400) {
        // Show more user-friendly error for missing cookies/credentials
        if (detail?.includes('ZALO_COOKIES') || detail?.includes('Missing')) {
          alert('Lỗi cấu hình bot: Thiếu hoặc sai ZALO_COOKIES. Vui lòng cập nhật cookie Zalo hợp lệ trong biến môi trường.');
        } else if (detail?.includes('Invalid ZALO_COOKIES JSON')) {
          alert('Lỗi cấu hình bot: ZALO_COOKIES không đúng định dạng JSON. Vui lòng kiểm tra lại biến môi trường.');
        } else {
          alert(`Lỗi cấu hình: ${detail || error.message}`);
        }
      } else {
        alert(`Lỗi: ${detail || error.message}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0h 0m 0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatUptimeShort = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getCommandTypeColor = (type) => {
    switch (type) {
      case 'user_command': return 'primary';
      case 'bot_response': return 'success';
      case 'system_action': return 'warning';
      default: return 'info';
    }
  };

  const getCommandTypeIcon = (type) => {
    switch (type) {
      case 'user_command': return <Command className="w-3 h-3" />;
      case 'bot_response': return <MessageSquare className="w-3 h-3" />;
      case 'system_action': return <Activity className="w-3 h-3" />;
      default: return <Code className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Tổng quan hệ thống bot Zalo</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Chat with Admin Button - For all users */}
          <button
            onClick={() => setShowChatWithAdmin(true)}
            className="btn-primary flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Chat với Quản trị viên
          </button>
          
          {/* Admin Chat Panel - For Admin+ only */}
          {currentUser?.role && ['admin', 'super_admin', 'moderator'].includes(currentUser.role) && (
            <button
              onClick={() => setShowAdminChatPanel(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Quản lý Chat
            </button>
          )}
          
          {/* Bot Control - Only for users with CONTROL_BOT permission */}
          {currentUser?.permissions?.includes('control_bot') && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg border border-dark-700">
                <div className={`w-2 h-2 rounded-full ${botStatus?.is_running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-dark-300">
                  {botStatus?.is_running ? 'Running' : 'Stopped'}
                </span>
              </div>
              
              {!botStatus?.is_running ? (
                <button
                  onClick={() => handleBotControl('start')}
                  disabled={actionLoading}
                  className="btn-success flex items-center gap-2"
                >
                  {actionLoading === 'start' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang bật...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Bot
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleBotControl('restart')}
                    disabled={actionLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {actionLoading === 'restart' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang reset...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4" />
                        Restart
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleBotControl('stop')}
                    disabled={actionLoading}
                    className="btn-danger flex items-center gap-2"
                  >
                    {actionLoading === 'stop' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang dừng...
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Stop
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
          
          {/* Logging Toggle */}
          <button
            onClick={handleLoggingToggle}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              loggingEnabled
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
            title={loggingEnabled ? 'Gửi logs' : 'Không gửi logs'}
          >
            <span className="text-xs font-medium">
              {loggingEnabled ? 'Logs: ON' : 'Logs: OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Bot Uptime"
          value={formatUptimeShort(localUptime)}
          color="blue"
          tooltip={
            <div className="space-y-1">
              <p className="text-blue-400 font-medium">⏱️ Thời gian hoạt động</p>
              <p className="text-white font-mono">{formatUptime(localUptime)}</p>
              <p className="text-dark-400 text-xs">Đặt lại khi bot dừng</p>
            </div>
          }
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Users"
          value={stats?.total_users || 0}
          color="purple"
          tooltip={
            <div className="space-y-1">
              <p className="text-purple-400 font-medium">👥 Chi tiết người dùng</p>
              <div className="space-y-0.5 text-dark-300">
                <p>👑 Super Admin: <span className="text-white">{stats?.user_breakdown?.super_admin || 0}</span></p>
                <p>🛡️ Admin: <span className="text-white">{stats?.user_breakdown?.admin || 0}</span></p>
                <p>🔧 Moderator: <span className="text-white">{stats?.user_breakdown?.moderator || 0}</span></p>
                <p>👤 Viewer: <span className="text-white">{stats?.user_breakdown?.viewer || 0}</span></p>
              </div>
            </div>
          }
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          label="Messages Today"
          value={stats?.messages_today || 0}
          color="green"
          tooltip={
            <div className="space-y-1">
              <p className="text-green-400 font-medium">💬 Tin nhắn hôm nay</p>
              <p className="text-dark-300">Tổng số tin nhắn được xử lý trong ngày</p>
            </div>
          }
        />
        <StatCard
          icon={<Command className="w-6 h-6" />}
          label="Active Commands"
          value={stats?.active_commands || 0}
          color="orange"
          tooltip={
            <div className="space-y-1">
              <p className="text-orange-400 font-medium">⚡ Lệnh hoạt động</p>
              <p className="text-dark-300">Số lệnh bot đang hỗ trợ</p>
            </div>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.activity_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="messages" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} />
            </LineChart>
          </ResponsiveContainer>
          {(!stats?.activity_data || stats.activity_data.every(d => d.messages === 0)) && (
            <p className="text-dark-500 text-center text-sm mt-2">Chưa có hoạt động</p>
          )}
        </div>

        {/* Command/Activity Logs with Tabs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Code className="w-5 h-5" />
              Logs & Console
            </h3>
            
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveLogTab('logs')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  activeLogTab === 'logs'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Logs
              </button>
              
              {/* Console tab only for Admin+ */}
              {currentUser?.permissions?.includes('view_logs') && (
                <button
                  onClick={() => setActiveLogTab('console')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    activeLogTab === 'console'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Console
                </button>
              )}
            </div>
          </div>
          
          {/* Logs Tab */}
          {activeLogTab === 'logs' && (
            <div className="space-y-3">
              {commandLogs.length > 0 ? (
                commandLogs
                  // Filter logs for viewers - only show basic info
                  .filter(log => 
                    currentUser?.permissions?.includes('VIEW_LOGS') || 
                    ['user_command', 'bot_response'].includes(log.command_type)
                  )
                  .slice(0, currentUser?.permissions?.includes('VIEW_LOGS') ? 50 : 10) // Limit for viewers
                  .map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors cursor-pointer group"
                    onClick={() => log.user_info && handleUserClick(log.user_info)}
                  >
                    <div className={`badge badge-${getCommandTypeColor(log.command_type)} flex-shrink-0`}>
                      {getCommandTypeIcon(log.command_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-dark-200 truncate flex-1">{log.message}</p>
                        {log.user_info && (
                          <div className="flex items-center gap-1 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <User className="w-3 h-3" />
                            <span>View Profile</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Raw content - only for Admin+ */}
                      {currentUser?.permissions?.includes('VIEW_LOGS') && log.raw_content && (
                        <div className="mb-2 p-2 bg-dark-900 rounded border border-dark-700">
                          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                            {log.raw_content}
                          </pre>
                        </div>
                      )}
                      
                      {/* User info */}
                      {log.user_info && (
                        <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
                          <User className="w-3 h-3" />
                          <span>{log.user_info.name || log.user_info.username || 'Unknown User'}</span>
                          {log.thread_id && (
                            <>
                              <MessageCircle className="w-3 h-3" />
                              <span>Thread: {log.thread_id}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-dark-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-dark-500 text-center py-4">Chưa có log nào</p>
              )}
              
              {/* Show limited message for viewers */}
              {!currentUser?.permissions?.includes('VIEW_LOGS') && (
                <p className="text-xs text-dark-400 text-center mt-2">
                  Hiển thị 10 logs gần nhất. Nâng cấp quyền để xem đầy đủ.
                </p>
              )}
            </div>
          )}
          
          {/* Console Tab - Only for Admin+ */}
          {activeLogTab === 'console' && currentUser?.permissions?.includes('VIEW_LOGS') && (
            <div className="space-y-3">
              <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-dark-400 ml-2">Console Output</span>
                </div>
                
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {commandLogs
                    .filter(log => ['system_action', 'bot_response'].includes(log.command_type))
                    .slice(0, 20)
                    .map((log) => (
                    <div key={log.id} className="text-xs font-mono">
                      <span className="text-dark-500">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`ml-2 ${
                        log.command_type === 'system_action' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUser}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
      />

      {/* Chat with Admin Modal */}
      <ChatWithAdmin
        currentUser={currentUser}
        isOpen={showChatWithAdmin}
        onClose={() => setShowChatWithAdmin(false)}
      />

      {/* Admin Chat Panel Modal */}
      <AdminChatPanel
        currentUser={currentUser}
        isOpen={showAdminChatPanel}
        onClose={() => setShowAdminChatPanel(false)}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
