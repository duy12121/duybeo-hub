import { useState } from 'react';
import { aiAPI } from '../services/api';
import { MessageCircle, X, Send } from 'lucide-react';

export function AiChatPopup({ open, onClose, floating = false, compact = false }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  if (!open) return null;

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const prompt = input.trim();
    setHistory((h) => [...h, { from: 'you', text: prompt }]);
    setInput('');
    try {
      const res = await aiAPI.chat(prompt);
      setHistory((h) => [...h, { from: 'ai', text: res.data.reply }]);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi kết nối';
      setHistory((h) => [...h, { from: 'ai', text: 'Lỗi: ' + msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const content = (
    <>
      <div className="flex items-center justify-between p-3 border-b border-dark-700">
        <span className="font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-400" />
          Chat AI (Gemini)
        </span>
        {floating && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div
        className={`overflow-auto bg-dark-900 p-3 space-y-2 ${compact ? 'max-h-64' : 'min-h-[200px] max-h-80'}`}
      >
        {history.length === 0 && (
          <p className="text-dark-500 text-sm text-center py-4">Nhập câu hỏi và nhấn Gửi hoặc Enter.</p>
        )}
        {history.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.from === 'you'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-700 rounded-lg px-3 py-2 text-dark-400 text-sm">Đang trả lời...</div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-dark-700 flex gap-2">
        <input
          className="input flex-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi cho AI..."
          disabled={loading}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Send className="w-4 h-4" />
          Gửi
        </button>
      </div>
    </>
  );

  if (floating) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col w-[380px] max-w-[calc(100vw-3rem)] bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      {content}
    </div>
  );
}

export function AiChatFloatingButton({ onClick, hasPermission }) {
  if (!hasPermission) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      title="Mở Chat AI"
      aria-label="Mở Chat AI"
    >
      <MessageCircle className="w-7 h-7" />
    </button>
  );
}
