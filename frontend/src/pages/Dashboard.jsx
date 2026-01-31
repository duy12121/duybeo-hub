import { useState, useEffect, useRef } from 'react';
import { dashboardAPI, botAPI, settingsAPI } from '../services/api';
import { Activity, Users, MessageSquare, Command, Play, Square, RotateCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { connectWebSocket } from '../services/websocket';

function StatCard({ icon, label, value, color, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div 
      className="card p-6 relative overflow-visible group hover:scale-105 transition-transform duration-200"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5 group-hover:opacity-10 transition-opacity rounded-xl`}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
          {icon}
        </div>
        <p className="text-dark-400 text-sm font-medium mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
      </div>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[100] w-52 p-3 bg-dark-800 border border-dark-600 rounded-lg shadow-2xl text-xs pointer-events-none">
          {tooltip}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-dark-800"></div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [localUptime, setLocalUptime] = useState(0);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    // Load initial data once
    loadData();
    
    // Connect to WebSocket for real-time updates (primary source)
    const setupWebSocket = async () => {
      try {
        wsRef.current = connectWebSocket((message) => {
          if (message.type === 'dashboard_stats' && message.data) {
            setStats(message.data);
          } else if (message.type === 'bot_status' && message.data) {
            setBotStatus(message.data);
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

  const handleLoggingToggle = async () => {
    try {
      await settingsAPI.setLoggingStatus(!loggingEnabled);
      setLoggingEnabled(!loggingEnabled);
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
        
        {/* Bot Control */}
        <div className="flex items-center gap-3">
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
                    Đang tắt...
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

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Logs</h3>
          <div className="space-y-3">
            {stats?.recent_logs?.length > 0 ? (
              stats.recent_logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700">
                  <div className={`badge badge-${log.level.toLowerCase() === 'error' ? 'error' : log.level.toLowerCase() === 'warning' ? 'warning' : 'info'} flex-shrink-0`}>
                    {log.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 truncate">{log.message}</p>
                    <p className="text-xs text-dark-500 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-dark-500 text-center py-4">Chưa có log nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
