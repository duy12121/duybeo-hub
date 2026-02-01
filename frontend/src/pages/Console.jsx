import { useState, useEffect, useRef } from 'react';
import { logsAPI, botAPI, settingsAPI } from '../services/api';
import websocket from '../services/websocket';
import { Terminal, Download, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function Console() {
  const [logs, setLogs] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [commandInput, setCommandInput] = useState('');
  const [activeTab, setActiveTab] = useState('logs');
  const [filter, setFilter] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const bottomRef = useRef(null);
  const commandInputRef = useRef(null);

  useEffect(() => {
    loadLogs();
    settingsAPI.getLoggingStatus().then((r) => setLoggingEnabled(!!r.data?.enabled)).catch(() => {});

    const handleNewLog = (logData) => {
      setLogs(prev => [logData, ...prev].slice(0, 1000));
    };

    const handleCommandResponse = (cmdData) => {
      setCommandHistory(prev => [...prev, cmdData].slice(-500));
    };

    websocket.on('log', handleNewLog);
    websocket.on('command', handleCommandResponse);

    return () => {
      websocket.off('log', handleNewLog);
      websocket.off('command', handleCommandResponse);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, commandHistory, autoScroll, activeTab]);

  const loadLogs = async () => {
    try {
      const response = await logsAPI.list({ limit: 100 });
      const formattedLogs = response.data.map(log => ({
        type: 'log',
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        details: log.details || {}
      }));
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const clearLogs = () => {
    if (window.confirm('Xóa tất cả logs?')) {
      setLogs([]);
    }
  };

  const clearCommands = () => {
    if (window.confirm('Xóa lịch sử lệnh?')) {
      setCommandHistory([]);
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

  const exportLogs = () => {
    const text = filteredLogs.map(log => 
      `[${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}] ${log.level}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const executeCommand = async () => {
    if (!commandInput.trim()) return;
    
    const cmd = commandInput.trim();
    const timestamp = new Date().toISOString();
    
    // Add command to history
    setCommandHistory(prev => [...prev, {
      type: 'input',
      command: cmd,
      timestamp,
      status: 'pending'
    }]);
    
    setCommandInput('');
    
    try {
      // Execute command via API
      let response;
      let output = '';
      
      if (cmd === 'status' || cmd === 'bot status') {
        response = await botAPI.getStatus();
        output = `Bot Status: ${response.data.is_running ? '🟢 Running' : '🔴 Stopped'}\nUptime: ${response.data.uptime || 0}s`;
      } else if (cmd === 'start' || cmd === 'bot start') {
        response = await botAPI.start();
        output = '✅ Bot started successfully';
      } else if (cmd === 'stop' || cmd === 'bot stop') {
        response = await botAPI.stop();
        output = '⏹️ Bot stopped';
      } else if (cmd === 'restart' || cmd === 'bot restart') {
        response = await botAPI.restart();
        output = '🔄 Bot restarted successfully';
      } else if (cmd === 'help') {
        output = `Available commands:
  status    - Show bot status
  start     - Start the bot
  stop      - Stop the bot
  restart   - Restart the bot
  clear     - Clear command history
  help      - Show this help`;
      } else if (cmd === 'clear') {
        setCommandHistory([]);
        return;
      } else {
        output = `Unknown command: ${cmd}\nType 'help' for available commands`;
      }
      
      setCommandHistory(prev => [...prev, {
        type: 'output',
        output,
        timestamp: new Date().toISOString(),
        status: 'success'
      }]);
    } catch (error) {
      setCommandHistory(prev => [...prev, {
        type: 'output',
        output: `Error: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date().toISOString(),
        status: 'error'
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const getLevelBg = (level) => {
    const colors = {
      INFO: 'bg-blue-500/10 border-blue-500/30',
      WARNING: 'bg-yellow-500/10 border-yellow-500/30',
      ERROR: 'bg-red-500/10 border-red-500/30',
      DEBUG: 'bg-gray-500/10 border-gray-500/30',
      SUCCESS: 'bg-green-500/10 border-green-500/30'
    };
    return colors[level] || 'bg-dark-500/10 border-dark-500/30';
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold text-white">Console</h1>
        </div>
        
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

      {/* Main Console Card */}
      <div className="card overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-dark-700 bg-dark-900 flex-shrink-0">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-3 py-2 font-medium text-sm transition-colors ${
              activeTab === 'logs'
                ? 'text-primary-400 border-b-2 border-primary-500 bg-dark-800/50'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            📋 Nhật Ký ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex-1 px-3 py-2 font-medium text-sm transition-colors ${
              activeTab === 'commands'
                ? 'text-primary-400 border-b-2 border-primary-500 bg-dark-800/50'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            ⚡ Terminal ({commandHistory.length})
          </button>
        </div>

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap mb-2 flex-shrink-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input py-1 px-2 text-xs h-7"
              >
                <option value="ALL">Tất Cả</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="DEBUG">DEBUG</option>
              </select>

              <label className="flex items-center gap-1 px-2 py-1 bg-dark-800 rounded border border-dark-700 cursor-pointer hover:bg-dark-700 transition-colors text-xs">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-3 h-3 rounded"
                />
                <span className="text-dark-300">Auto</span>
              </label>

              <div className="flex-1"></div>

              <button onClick={exportLogs} className="p-1 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded text-xs transition-colors" title="Tải xuống">
                <Download className="w-3 h-3" />
              </button>

              <button onClick={clearLogs} className="p-1 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition-colors" title="Xóa">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Logs Display */}
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-dark-950 rounded border border-dark-700">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-dark-500 text-xs">
                  <p>Chưa có logs...</p>
                </div>
              ) : (
                <>
                  {filteredLogs.map((log, index) => (
                    <div 
                      key={index}
                      className={`px-2 py-1 rounded border text-xs ${getLevelBg(log.level)} hover:bg-dark-800/50 transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-dark-500 flex-shrink-0 whitespace-nowrap">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </span>
                        <span className={`badge badge-sm badge-${log.level.toLowerCase() === 'error' ? 'error' : log.level.toLowerCase() === 'warning' ? 'warning' : 'info'} flex-shrink-0`}>
                          {log.level}
                        </span>
                        <span className="text-dark-200 flex-1 truncate">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Commands/Terminal Tab */}
        {activeTab === 'commands' && (
          <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <p className="text-dark-400 text-xs font-mono">zalo-bot@terminal:~$</p>
              <button
                onClick={clearCommands}
                className="p-1 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition-colors"
                title="Xóa lịch sử"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-dark-950 rounded-t border border-b-0 border-dark-700">
              {commandHistory.length === 0 ? (
                <div className="text-dark-500">
                  <p>Welcome to Zalo Bot Terminal</p>
                  <p>Type 'help' for available commands</p>
                </div>
              ) : (
                commandHistory.map((item, idx) => (
                  <div key={idx} className="mb-1">
                    {item.type === 'input' && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">$</span>
                        <span className="text-white">{item.command}</span>
                      </div>
                    )}
                    {item.type === 'output' && (
                      <pre className={`whitespace-pre-wrap pl-4 ${item.status === 'error' ? 'text-red-400' : 'text-dark-300'}`}>
                        {item.output}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Terminal Input */}
            <div className="flex items-center gap-2 p-2 bg-dark-900 rounded-b border border-t-0 border-dark-700 flex-shrink-0">
              <span className="text-green-400 font-mono text-sm">$</span>
              <input
                ref={commandInputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder-dark-500"
              />
              <button
                onClick={executeCommand}
                className="p-1.5 text-primary-400 hover:bg-primary-500/20 rounded transition-colors"
                title="Execute"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
