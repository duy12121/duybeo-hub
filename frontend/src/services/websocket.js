class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {
      log: [],
      bot_status: [],
      dashboard_stats: [],
      connect: [],
      disconnect: [],
    };
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
    this.messageCallbacks = [];
  }

  connect(userId) {
    const WS_URL = (import.meta.env.VITE_WS_URL || '').replace(/\/+$/, '') ||
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    
    try {
      this.ws = new WebSocket(`${WS_URL}/ws/${userId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.emit('connect');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Call all registered message callbacks
          this.messageCallbacks.forEach(callback => callback(data));
          
          if (data.type === 'log') {
            this.emit('log', data);
          } else if (data.type === 'bot_status') {
            this.emit('bot_status', data.data);
          } else if (data.type === 'dashboard_stats') {
            this.emit('dashboard_stats', data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnect');
        
        // Attempt to reconnect
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect(userId);
        }, this.reconnectInterval);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addMessageCallback(callback) {
    this.messageCallbacks.push(callback);
  }

  removeMessageCallback(callback) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }
}

const wsService = new WebSocketService();

/**
 * Connect to WebSocket with a callback function
 * @param {Function} onMessage - Callback function that receives all messages
 * @returns {WebSocket|null} The WebSocket instance or null if connection fails
 */
export function connectWebSocket(onMessage) {
  try {
    const userId = localStorage.getItem('user_id') || 'anonymous';
    wsService.addMessageCallback(onMessage);
    
    // If already connected, just add callback and return
    if (wsService.ws && wsService.ws.readyState === WebSocket.OPEN) {
      return wsService.ws;
    }
    
    wsService.connect(userId);
    return wsService.ws;
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    return null;
  }
}

export default wsService;
