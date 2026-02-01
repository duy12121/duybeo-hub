import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  checkUsername: (username) =>
    api.post('/auth/check-username', null, { params: { username } }),
  checkEmail: (email) =>
    api.post('/auth/check-email', null, { params: { email } }),
  // register without email (email optional). Signature: register(username, password, fullName, email?)
  register: (username, password, fullName, email = undefined) =>
    api.post('/auth/register', {
      username,
      password,
      full_name: fullName,
      ...(email ? { email } : {}),
    }),
  getMe: async () => {
    const response = await api.get('/auth/me');
    if (response.data?.id) {
      localStorage.setItem('user_id', response.data.id);
    }
    return response;
  },
};

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const settingsAPI = {
  getLoggingStatus: () => api.get('/settings/logging'),
  setLoggingStatus: (enabled) => api.post('/settings/logging', null, { params: { enabled } }),
};

export const botAPI = {
  getStatus: () => api.get('/bot/status'),
  start: () => api.post('/bot/start'),
  stop: () => api.post('/bot/stop'),
  restart: () => api.post('/bot/restart'),
  getConfig: () => api.get('/bot/config'),
  updateConfig: (data) => api.put('/bot/config', data),
};

export const logsAPI = {
  list: (params) => api.get('/logs', { params }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const aiAPI = {
  chat: (message, thread_id = undefined) => api.post('/ai/chat', { message, ...(thread_id ? { thread_id } : {}) }),
};

export const chatAPI = {
  // User chat endpoints
  createSession: (userData) => api.post('/chat/session', userData),
  sendMessage: (data) => api.post('/chat/message', data),
  cleanupSession: (sessionId) => api.delete(`/chat/session/${sessionId}`),
  
  // Admin chat endpoints
  getAdminSessions: (params) => api.get('/chat/admin/sessions', { params }),
  getSessionMessages: (sessionId) => api.get(`/chat/admin/sessions/${sessionId}/messages`),
  sendAdminMessage: (data) => api.post('/chat/admin/message', data),
};

export default api;
