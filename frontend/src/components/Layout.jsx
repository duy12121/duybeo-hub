import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Terminal, Shield, Bot, LogOut, Menu, X, User } from 'lucide-react';
import { authAPI } from '../services/api';
import websocket from '../services/websocket';
import { AiChatPopup, AiChatFloatingButton } from './AiChatPopup';
import { useNotifications } from '../hooks/useNotifications';
import NotificationToast from './NotificationToast';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const panelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { notification, clearNotification } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setUserPanelOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      
      // Connect WebSocket
      websocket.connect(response.data.id);
    } catch (error) {
      console.error('Failed to load user:', error);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    websocket.disconnect();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/console', icon: Terminal, label: 'Console' },
    { path: '/admin', icon: Shield, label: 'Admin Panel', permission: 'view_users' },
  ];

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-dark-900 border-r border-dark-800 
        transition-all duration-300 
        flex flex-col
        relative
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-white text-lg">Bot Manager</h1>
                <p className="text-xs text-dark-400">Zalo Bot</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) return null;
            
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50' 
                    : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - clickable, shows user info panel */}
        <div className="p-4 border-t border-dark-800 relative" ref={panelRef}>
          {sidebarOpen ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setUserPanelOpen(!userPanelOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-primary-400 truncate">
                    Quyền: {user?.role === 'super_admin' ? 'Quản trị viên cấp cao' : 
                              user?.role === 'admin' ? 'Quản trị viên' : 
                              user?.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người qua đường'}
                  </p>
                </div>
                <User className="w-4 h-4 text-dark-400 flex-shrink-0" />
              </button>
              {userPanelOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 p-4 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 space-y-3">
                  <p className="text-xs font-semibold text-dark-400 uppercase">Thông tin tài khoản</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-dark-400">Tên tài khoản:</span> <span className="text-white">{user?.full_name || user?.username || '—'}</span></p>
                    <p><span className="text-dark-400">Tên đăng nhập:</span> <span className="text-white">{user?.username || '—'}</span></p>
                    <p><span className="text-dark-400">Email:</span> <span className="text-white">{user?.email || '—'}</span></p>
                    <p><span className="text-dark-400">Thời gian tạo:</span> <span className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '—'}</span></p>
                    <p><span className="text-dark-400">Chức vụ:</span> <span className="text-primary-400">{user?.role === 'super_admin' ? 'Quản trị viên cấp cao' : user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người qua đường'}</span></p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setUserPanelOpen(!userPanelOpen)}
                className="w-full flex items-center justify-center p-3 text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
                title="Thông tin tài khoản"
              >
                <User className="w-5 h-5" />
              </button>
              {userPanelOpen && (
                <div className="absolute bottom-full left-2 right-2 mb-2 p-4 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 space-y-3 min-w-[220px]">
                  <p className="text-xs font-semibold text-dark-400 uppercase">Thông tin tài khoản</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-dark-400">Tên:</span> <span className="text-white">{user?.full_name || user?.username || '—'}</span></p>
                    <p><span className="text-dark-400">Đăng nhập:</span> <span className="text-white">{user?.username || '—'}</span></p>
                    <p><span className="text-dark-400">Email:</span> <span className="text-white truncate block">{user?.email || '—'}</span></p>
                    <p><span className="text-dark-400">Tạo lúc:</span> <span className="text-white text-xs">{user?.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '—'}</span></p>
                    <p><span className="text-dark-400">Chức vụ:</span> <span className="text-primary-400">{user?.role === 'super_admin' ? 'Quản trị cấp cao' : user?.role === 'admin' ? 'Quản trị' : user?.role === 'moderator' ? 'Kiểm duyệt' : 'Người qua đường'}</span></p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 mt-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-dark-800 border border-dark-700 rounded-full flex items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          {sidebarOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Floating AI Chat - bottom right */}
      {hasPermission('configure_bot') && (
        <>
          {!aiChatOpen && (
            <AiChatFloatingButton
              hasPermission={true}
              onClick={() => setAiChatOpen(true)}
            />
          )}
          <AiChatPopup
            open={aiChatOpen}
            onClose={() => setAiChatOpen(false)}
            floating
            compact
          />
        </>
      )}
      
      <NotificationToast 
        notification={notification} 
        onClose={clearNotification} 
      />
    </div>
  );
}
