import { useState, useEffect, memo } from 'react';
import { X, Mail, Calendar, Shield, MessageSquare, Command, User, Clock, CheckCircle, XCircle } from 'lucide-react';

const UserProfileModal = memo(({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'admin': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'moderator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'viewer': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">Username</label>
                    <p className="text-white font-medium">{profile.username}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">Display Name</label>
                    <p className="text-white font-medium">{profile.full_name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-dark-400" />
                      <p className="text-white">{profile.email || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">Role</label>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(profile.role)}`}>
                      <Shield className="w-3 h-3" />
                      {getRoleLabel(profile.role)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">Status</label>
                    <div className="flex items-center gap-2">
                      {profile.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-400">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-400">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-dark-400 uppercase tracking-wider">User ID</label>
                    <p className="text-dark-300 text-sm font-mono">{profile.id}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-dark-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Command className="w-5 h-5" />
                  Activity Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-400">{profile.total_commands}</div>
                    <div className="text-xs text-dark-400">Total Commands</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{profile.total_messages}</div>
                    <div className="text-xs text-dark-400">Total Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{profile.total_commands > 0 ? 'Active' : 'Idle'}</div>
                    <div className="text-xs text-dark-400">Activity Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{Math.round(profile.total_commands / Math.max(1, Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24))))}</div>
                    <div className="text-xs text-dark-400">Daily Avg</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-white">Account Created</p>
                      <p className="text-xs text-dark-400">
                        {new Date(profile.created_at).toLocaleDateString()} at {new Date(profile.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {profile.last_login && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-white">Last Login</p>
                        <p className="text-xs text-dark-400">
                          {new Date(profile.last_login).toLocaleDateString()} at {new Date(profile.last_login).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-dark-400">Failed to load user profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

UserProfileModal.displayName = 'UserProfileModal';

export default UserProfileModal;
