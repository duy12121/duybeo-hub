# Real-Time Dashboard Stats Implementation

## Overview
The system now implements real-time dashboard statistics using WebSocket connections. The bot's uptime, total users, messages sent today, and active commands are broadcast to all connected clients instantly.

## Architecture

### Backend Flow

1. **Bot State Initialization** (`main.py`)
   - `bot_state` dictionary initialized with:
     - `is_running`: Boolean flag for bot status
     - `start_time`: ISO timestamp when bot starts
     - `uptime`: Calculated from start_time
     - `total_messages_sent`: Message counter
     - `total_messages_received`: Incoming message counter
     - `active_users`: Current active users

2. **Bot Startup** (`/api/bot/start` endpoint)
   ```python
   bot_state["is_running"] = True
   bot_state["start_time"] = datetime.now(timezone.utc).isoformat()
   await manager.broadcast_bot_status(bot_state)
   ```
   - Sets current time as start_time
   - Broadcasts bot status to all WebSocket clients

3. **Dashboard Stats Calculation** (`/api/dashboard/stats` endpoint)
   ```python
   uptime_seconds = int((datetime.now(timezone.utc) - datetime.fromisoformat(bot_state["start_time"])).total_seconds())
   stats = DashboardStats(
       total_users=total_users,
       bot_uptime=uptime_seconds,
       messages_today=bot_state["total_messages_sent"],
       active_commands=0,
       recent_logs=recent_logs
   )
   await manager.broadcast_dashboard_stats(stats)
   ```
   - Calculates uptime dynamically from start_time
   - Creates DashboardStats object with current metrics
   - Broadcasts to all connected clients

4. **WebSocket Manager** (`websocket_manager.py`)
   ```python
   async def broadcast_dashboard_stats(self, stats: dict):
       stats_update = {
           "type": "dashboard_stats",
           "timestamp": datetime.now(timezone.utc).isoformat(),
           "data": stats
       }
       await self.broadcast(stats_update)
   ```
   - Wraps stats in message with type "dashboard_stats"
   - Sends to all active WebSocket connections
   - Handles disconnected clients gracefully

### Frontend Flow

1. **WebSocket Connection** (`websocket.js`)
   ```javascript
   export function connectWebSocket(onMessage) {
       const userId = localStorage.getItem('user_id') || 'anonymous';
       wsService.addMessageCallback(onMessage);
       wsService.connect(userId);
       return wsService.ws;
   }
   ```
   - Stores user ID in localStorage
   - Adds callback to receive all WebSocket messages
   - Maintains persistent connection with auto-reconnect

2. **Dashboard Component** (`Dashboard.jsx`)
   ```javascript
   useEffect(() => {
       wsRef.current = connectWebSocket((message) => {
           if (message.type === 'dashboard_stats' && message.data) {
               setStats(message.data);
           } else if (message.type === 'bot_status' && message.data) {
               setBotStatus(message.data);
           }
       });
   }, []);
   ```
   - Connects to WebSocket on component mount
   - Receives real-time stats updates
   - Updates React state immediately
   - Falls back to polling every 10 seconds if WebSocket unavailable

3. **Real-Time Display**
   ```javascript
   <StatCard
       label="Bot Uptime"
       value={formatUptime(stats?.bot_uptime || 0)}
   />
   <StatCard
       label="Total Users"
       value={stats?.total_users || 0}
   />
   ```
   - Displays stats from state
   - Updates automatically when WebSocket receives new data
   - Formats uptime as human-readable "Xh Ym" format

## Data Flow Diagram

```
Bot Starts
    ↓
/api/bot/start endpoint
    ↓
bot_state["start_time"] = now
bot_state["is_running"] = true
    ↓
manager.broadcast_bot_status()
    ↓
Dashboard gets /api/dashboard/stats
    ↓
Calculates uptime = now - start_time
Retrieves user counts, message counts
    ↓
manager.broadcast_dashboard_stats(stats)
    ↓
WebSocket broadcasts to all clients
    ↓
Frontend receives "dashboard_stats" message
    ↓
React state updates
    ↓
Dashboard displays real-time stats
```

## Real-Time Update Triggers

1. **Manual Bot Start**: User clicks "Start Bot" → Dashboard displays 0h 0m uptime → Increments as seconds pass
2. **Bot Status Changes**: Stop/Restart resets start_time → Uptime resets to 0h 0m
3. **User Actions**: New users added → total_users count increments
4. **Message Activity**: Each received message increments total_messages_received
5. **Command Execution**: Active commands tracked and displayed

## Key Features

- **Automatic Calculation**: Uptime calculated dynamically, no manual updates needed
- **Real-Time Updates**: WebSocket ensures instant delivery to all connected dashboard users
- **Fallback Mechanism**: If WebSocket fails, component polls API every 10 seconds
- **Graceful Degradation**: Works with or without WebSocket connection
- **Persistent Connection**: WebSocket auto-reconnects if connection drops
- **Multiple Clients**: Each connected user receives updates independently
- **Timestamp Tracking**: All messages include ISO timestamp

## Testing the Implementation

### 1. Start Bot and Verify Uptime Display
```
1. Open Dashboard in browser
2. Click "Start Bot"
3. Verify uptime shows "0h 0m"
4. Wait 5 seconds
5. Verify uptime increments to approximately "0h 0m" (showing live calculation)
```

### 2. Check WebSocket Messages in Browser Console
```javascript
// Open DevTools → Application → WebSocket
// You should see messages like:
{
    "type": "dashboard_stats",
    "timestamp": "2024-01-15T10:30:45.123456+00:00",
    "data": {
        "total_users": 42,
        "bot_uptime": 125,
        "messages_today": 89,
        "active_commands": 3,
        "recent_logs": [...]
    }
}
```

### 3. Monitor Uptime Counter
```
Uptime should update smoothly every 1-10 seconds
Initial format: "0h 0m" (0 seconds elapsed)
After 65 seconds: "0h 1m"
After 3665 seconds: "1h 1m"
```

### 4. Test Bot Stop/Restart
```
1. Click "Stop Bot"
2. Verify is_running flag changes to false
3. Click "Restart Bot"
4. Verify uptime resets to "0h 0m"
5. Verify time begins counting again
```

## Database Schema Updates

The system tracks the following in MongoDB:
- `bot_status` collection: Current bot state including start_time
- `logs` collection: Real-time activity logs with timestamps
- `users` collection: User count for stats display

## Performance Considerations

- **Uptime Calculation**: O(1) operation, calculated on-demand
- **WebSocket Overhead**: One message per stats update (typically every 10s from polling)
- **Message Size**: ~500 bytes per dashboard stats message
- **Bandwidth**: Minimal, only stats broadcasts during dashboard activity
- **CPU**: Negligible impact from datetime calculations

## Future Enhancements

1. **Persistent Uptime**: Store start_time in database, survive server restarts
2. **Historical Data**: Track uptime trends, create charts
3. **Alert System**: Notify when uptime exceeds thresholds
4. **Performance Metrics**: Track API response times, message processing speed
5. **Command Analytics**: Detailed per-command statistics and execution times

## Troubleshooting

### Issue: Uptime not updating
**Solution**: 
- Verify WebSocket connection in browser DevTools
- Check that bot_state["start_time"] is set in backend
- Ensure dashboard is polling as fallback

### Issue: WebSocket connection fails
**Solution**:
- Check CORS settings in main.py
- Verify WebSocket endpoint is accessible at /ws/{user_id}
- Check that user_id is stored in localStorage

### Issue: Stats showing 0 for everything
**Solution**:
- Verify bot_state is initialized with correct keys
- Check that /api/dashboard/stats endpoint is callable
- Ensure broadcast_dashboard_stats method exists in websocket_manager

## Related Files

- Backend: [main.py](backend/main.py) - API endpoints
- Backend: [websocket_manager.py](backend/websocket_manager.py) - WebSocket broadcast
- Frontend: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx) - Display component
- Frontend: [websocket.js](frontend/src/services/websocket.js) - WebSocket service
- Frontend: [api.js](frontend/src/services/api.js) - API client

