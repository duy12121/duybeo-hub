import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Terminal, Shield, Bot, LogOut, Menu, X } from 'lucide-react';
import { authAPI } from '../services/api';
import websocket from '../services/websocket';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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

        {/* User Profile */}
        <div className="p-4 border-t border-dark-800">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-dark-800 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-primary-400 truncate">
                    Quyền hạn: {user?.role === 'super_admin' ? 'Quản trị viên cấp cao' : 
                                user?.role === 'admin' ? 'Quản trị viên' : 
                                user?.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người qua đường'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
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
    </div>
  );
}
