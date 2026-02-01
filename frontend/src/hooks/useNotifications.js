import { useState, useEffect } from 'react';
import { connectWebSocket } from '../services/websocket';

export function useNotifications() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let ws = null;
    
    const setupWebSocket = () => {
      try {
        ws = connectWebSocket((message) => {
          if (message.type === 'role_update' && message.data) {
            setNotification({
              type: 'role_update',
              message: message.data.message,
              data: message.data
            });
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setNotification(null);
            }, 5000);
          }
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const clearNotification = () => {
    setNotification(null);
  };

  return { notification, clearNotification };
}
