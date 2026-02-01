# 🔄 Gemini API Key Rotation System

## Overview

Advanced API key rotation system for Gemini AI with automatic failover, rate limit handling, and auto-relogin capabilities.

## ✨ Features

### 🔄 **API Key Rotation**
- **Round-Robin**: Automatically cycles through multiple API keys
- **Smart Failover**: Switches to next key when current key hits rate limits
- **Cooldown Tracking**: Failed keys are temporarily marked unavailable (60s default)
- **Thread-Safe**: Uses locks to prevent race conditions

### 🛡️ **Rate Limit Handling**
- **429 Error Detection**: Automatically detects rate limit errors
- **Automatic Retry**: Retries with next available key (up to 3 attempts)
- **Graceful Degradation**: Returns meaningful error messages when all keys fail

### 🤖 **Auto-Relogin**
- **Cookie-Based**: Uses existing Zalo cookies for reauthentication
- **Smart Detection**: Triggers on Zalo-related requests during rate limits
- **Background Process**: Non-blocking relogin attempts
- **Cooldown Protection**: 5-minute cooldown between relogin attempts

## 🚀 Setup

### Environment Variables

Replace the old `GEMINI_API_KEY` with `GEMINI_KEYS`:

```bash
# Old way (single key)
GEMINI_API_KEY=your-single-api-key

# New way (multiple keys for rotation)
GEMINI_KEYS=key1,key2,key3
```

### Example Configuration

```bash
# .env file
GEMINI_KEYS=AIzaSy...,AIzaSy...,AIzaSy...

# Zalo credentials (required for auto-relogin)
ZALO_API_KEY=your-zalo-api-key
ZALO_SECRET_KEY=your-zalo-secret-key
ZALO_IMEI=your-device-imei
ZALO_COOKIES={"session_id": "...", "cookie": "..."}
```

## 📊 Monitoring

### API Endpoints

#### Get API Key Status
```http
GET /api/gemini/status
```

Response:
```json
{
  "total_keys": 3,
  "available_keys": 2,
  "failed_keys": 1,
  "current_index": 1,
  "keys": [
    {
      "index": 0,
      "key_preview": "AIzaSy...",
      "is_failed": false,
      "failed_at": null,
      "cooldown_remaining": 0
    },
    {
      "index": 1,
      "key_preview": "AIzaSy...",
      "is_failed": true,
      "failed_at": 1640995200,
      "cooldown_remaining": 45
    }
  ]
}
```

#### Reset Failed Keys
```http
POST /api/gemini/reset-keys
```

Response:
```json
{
  "message": "Failed API keys reset successfully"
}
```

## 🔧 Configuration Options

### Rotation Settings

```python
# In gemini_client.py

# Cooldown period for failed keys (seconds)
_retry_cooldown = 60

# Maximum retry attempts across different keys
max_retries = 3

# Relogin cooldown (seconds)
_relogin_cooldown = 300  # 5 minutes
```

### Rate Limiting

```python
# Per-user rate limiting (requests per minute)
AI_RATE_LIMIT_PER_MIN = 20
```

## 🔄 How It Works

### 1. **Initialization**
- Reads `GEMINI_KEYS` from environment
- Splits into array of API keys
- Initializes client instances for each key

### 2. **Request Flow**
```
User Request → Get Next Available Key → Try API Call
    ↓
If Success → Return Response
    ↓
If 429 Error → Mark Key Failed → Try Next Key
    ↓
If Zalo Request → Trigger Auto-Relogin
    ↓
If All Keys Fail → Return Error
```

### 3. **Key Selection Logic**
```python
def _get_next_available_key():
    # Round-robin through keys
    # Skip keys in cooldown
    # Return first available key
```

### 4. **Auto-Relogin Process**
```python
def _perform_auto_relogin():
    # Get Zalo credentials from environment
    # Reinitialize bot with existing cookies
    # Restart bot if it was running
```

## 🚨 Error Handling

### Common Scenarios

#### All Keys Rate Limited
```json
{
  "detail": "All Gemini API keys failed. Last error: Rate limit exceeded"
}
```

#### No API Keys Configured
```json
{
  "detail": "GEMINI_KEYS not set in environment. Format: 'key1,key2,key3'"
}
```

#### Invalid API Key Format
```json
{
  "detail": "No valid API keys found in GEMINI_KEYS"
}
```

## 🛠️ Troubleshooting

### Keys Not Rotating
1. Check `GEMINI_KEYS` environment variable format
2. Verify all keys are valid and active
3. Check logs for rotation messages

### Auto-Relogin Not Working
1. Verify Zalo credentials are set
2. Check `ZALO_COOKIES` format (valid JSON)
3. Review relogin cooldown period

### High Failure Rate
1. Check individual API key quotas
2. Monitor rate limit usage
3. Consider increasing cooldown period

## 📈 Best Practices

### API Key Management
- Use 3-5 API keys for optimal rotation
- Monitor individual key usage
- Rotate keys periodically for security

### Rate Limiting
- Set appropriate per-user limits
- Monitor overall usage patterns
- Implement caching for repeated requests

### Auto-Relogin
- Keep cookies fresh and valid
- Monitor relogin success rate
- Adjust cooldown based on Zalo limits

## 🔒 Security Considerations

- **Environment Variables**: Never commit API keys to git
- **Key Rotation**: Regularly rotate API keys
- **Access Control**: Limit who can reset failed keys
- **Monitoring**: Log key usage and failures

## 📝 Migration Guide

### From Single Key to Rotation

1. **Update Environment Variables**:
   ```bash
   # Remove
   GEMINI_API_KEY=old-key
   
   # Add
   GEMINI_KEYS=key1,key2,key3
   ```

2. **Update Code**:
   ```python
   # Old import
   from gemini_client import generate_content
   
   # New import (same function, enhanced)
   from gemini_client import generate_content, get_api_key_status
   ```

3. **Test Migration**:
   - Check API key status endpoint
   - Test with multiple requests
   - Verify rotation behavior

## 🎯 Performance Benefits

- **Higher Throughput**: 3x request capacity with 3 keys
- **Better Reliability**: Automatic failover reduces downtime
- **Cost Optimization**: Efficient usage across multiple quotas
- **User Experience**: Fewer failed requests, faster responses

---

## 📞 Support

For issues with the API key rotation system:
1. Check environment variable configuration
2. Review API key quotas and limits
3. Monitor application logs
4. Test with individual keys
