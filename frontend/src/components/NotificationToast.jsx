import { useEffect } from 'react';
import { X, Shield, Crown } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'role_update':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      default:
        return <Shield className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-dark-800 border border-yellow-500/30 rounded-lg shadow-xl p-4 min-w-[300px] max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <p className="text-white font-medium">{notification.message}</p>
            {notification.data && (
              <div className="mt-1 text-xs text-dark-400">
                <p>Quyền: {notification.data.role_name}</p>
                {notification.data.username && (
                  <p>User: {notification.data.username}</p>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
