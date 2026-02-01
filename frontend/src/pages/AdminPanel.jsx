import { useState, useEffect } from 'react';
import { usersAPI, authAPI } from '../services/api';
import { Users, Plus, Edit2, Trash2, Shield, X, MessageCircle } from 'lucide-react';
import { AiChatPopup } from '../components/AiChatPopup';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'ai'

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;

    try {
      await usersAPI.delete(userId);
      await loadUsers();
    } catch (error) {
      alert('Failed to delete user: ' + error.response?.data?.detail);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Quản trị viên cấp cao' },
      admin: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Quản trị viên' },
      moderator: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Kiểm duyệt' },
      viewer: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Người qua đường' },
    };
    const badge = badges[role] || badges.viewer;
    return <span className={`badge ${badge.color}`}>{badge.label}</span>;
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Bảng Quản Trị</h1>
            <p className="text-dark-400 mt-1">Quản lý người dùng và Chat AI</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="card p-4 bg-dark-800/50 border border-dark-700/50">
              <p className="text-xs text-dark-400 mb-2 uppercase font-semibold">Quyền Hạn Hiện Tại</p>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                  {currentUser.role === 'super_admin' && 'Quản trị viên cấp cao'}
                  {currentUser.role === 'admin' && 'Quản trị viên'}
                  {currentUser.role === 'moderator' && 'Kiểm duyệt'}
                  {currentUser.role === 'viewer' && 'Người qua đường'}
                </span>
                {currentUser.permissions && currentUser.permissions.slice(0, 3).map((perm) => (
                  <span key={perm} className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                    {perm.replace(/_/g, ' ')}
                  </span>
                ))}
                {currentUser.permissions && currentUser.permissions.length > 3 && (
                  <span className="text-dark-500 text-xs">+{currentUser.permissions.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm Người Dùng
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Users | Ai */}
      <div className="flex gap-2 border-b border-dark-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-primary-600 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-2 align-middle" />
          Người dùng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-primary-600 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline-block mr-2 align-middle" />
          Ai
        </button>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800 border-b border-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Người Dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Vai Trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Quyền Hạn
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Ngày Tạo
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {user.username}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-primary-400 font-normal">(bạn)</span>
                          )}
                        </p>
                        {user.full_name && (
                          <p className="text-sm text-dark-400">{user.full_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-dark-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions && user.permissions.length > 0 ? (
                        user.permissions.slice(0, 2).map((perm) => (
                          <span key={perm} className="inline-block bg-dark-700 text-dark-300 text-xs px-2 py-1 rounded">
                            {perm.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-dark-500 text-sm">Không có</span>
                      )}
                      {user.permissions && user.permissions.length > 2 && (
                        <span className="text-dark-500 text-xs">+{user.permissions.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="badge badge-success">Hoạt Động</span>
                    ) : (
                      <span className="badge badge-error">Không Hoạt Động</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tab: Ai - Chat inline */}
      {activeTab === 'ai' && (
        <div className="max-w-2xl">
          <AiChatPopup open={true} onClose={() => {}} floating={false} compact={false} />
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '',
    role: user?.role || 'viewer',
    is_active: user?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Update
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        delete updateData.username; // Can't change username
        await usersAPI.update(user.id, updateData);
      } else {
        // Create
        await usersAPI.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-md relative animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-display font-bold text-white mb-6">
          {user ? 'Edit User' : 'Create New User'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Username {!user && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
              disabled={!!user}
              required={!user}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Password {!user && <span className="text-red-400">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required={!user}
              placeholder={user ? 'Leave blank to keep current' : ''}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              required
            >
              <option value="viewer">Viewer</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Active Status */}
          {user && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-300">Active</span>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
