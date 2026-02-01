import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, User, Bot, Check, X } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken'
  
  const navigate = useNavigate();

  const usernameTimerRef = useRef(null);
  // Check username availability (debounced + normalized)
  const handleUsernameChange = (value) => {
    setUsername(value);
    setUsernameStatus(null);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    if (value.length < 3) {
      return;
    }

    usernameTimerRef.current = setTimeout(async () => {
      const normalized = value.trim().toLowerCase();
      setUsernameStatus('checking');
      try {
        const response = await authAPI.checkUsername(normalized);
        setUsernameStatus(response.data.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus(null);
      }
    }, 400);
  };

  

  const validateForm = () => {
    if (!username.trim() || !password || !confirmPassword) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return false;
    }
    
    if (username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }
    
    if (usernameStatus === 'taken') {
      setError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác');
      return false;
    }
    
    if (usernameStatus === 'checking') {
      setError('Đang kiểm tra tên đăng nhập...');
      return false;
    }
    
    
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Normalize before submitting
      const uname = username.trim().toLowerCase();
      const response = await authAPI.register(uname, password, fullName);
      // Backend returns token directly, no need for separate login request
      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'username_exists') {
        setError('Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác');
      } else if (detail === 'email_exists') {
        setError('Gmail đã được sử dụng cho tài khoản khác');
      } else {
        setError(detail || 'Đăng ký thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse-slow"></div>
        <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Zalo Bot Manager
          </h1>
          <p className="text-dark-400 text-sm">
            Tạo tài khoản mới
          </p>
        </div>

        {/* Register Card */}
        <div className="card p-8 backdrop-blur-xl bg-dark-900/50 border border-dark-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Tên đầy đủ (Tùy chọn)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Nguyễn Văn A"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Tên đăng nhập <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="input pl-11 pr-10"
                  placeholder="username"
                  required
                />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    )}
                    {usernameStatus === 'available' && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                    {usernameStatus === 'taken' && (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-dark-500 mt-1">Tối thiểu 3 ký tự</p>
            </div>

            {/* Email removed: registration uses username+password only */}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="text-xs text-dark-500 mt-1">Tối thiểu 6 ký tự</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Xác nhận mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng ký...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-dark-700/50 text-center">
            <p className="text-dark-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
