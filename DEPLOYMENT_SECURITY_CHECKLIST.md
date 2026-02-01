# 🚀 Deployment Security Checklist

## ✅ Pre-Deployment Security Checks

### 🔐 Environment Variables (REQUIRED)
- [ ] Set strong `SECRET_KEY` (min 32 characters)
- [ ] Set `DEFAULT_ADMIN_PASSWORD` to secure password
- [ ] Set `DEFAULT_ADMIN_EMAIL` to your email
- [ ] Configure `CORS_ORIGINS` with production domain
- [ ] Set `MONGO_URI` to production MongoDB
- [ ] Set Zalo API credentials (`ZALO_API_KEY`, `ZALO_SECRET_KEY`, `ZALO_IMEI`, `ZALO_COOKIES`)

### 🛡️ Security Configuration
- [ ] Remove all debug endpoints (✅ Done)
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Configure MongoDB with authentication
- [ ] Set up rate limiting (if needed)

### 🌐 Frontend Configuration
- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Set `VITE_WS_URL` to production WebSocket URL
- [ ] Disable debug mode (`VITE_DEBUG=false`)

## 🚀 Deployment Platforms

### Render.com
1. **Backend Service**
   - Environment variables set in Render dashboard
   - Health check: `/api/health`
   - Auto-deploy from main branch

2. **Frontend Service**
   - Static site hosting
   - Build command: `npm run build`
   - Environment variables for API URLs

### Railway.app
1. **Single Service**
   - Backend + Frontend served together
   - Health check: `/api/health`
   - Environment variables in Railway dashboard

## ⚠️ Important Security Notes

1. **Change Default Credentials**: Always change admin credentials in production
2. **MongoDB Security**: Use MongoDB Atlas with IP whitelisting
3. **API Keys**: Never commit real API keys to git
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Restrict CORS origins to your domain only

## 🔄 Post-Deployment Checklist

- [ ] Test login with new admin credentials
- [ ] Verify bot functionality
- [ ] Check WebSocket connections
- [ ] Test logging toggle feature
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## 🚨 Emergency Procedures

### If Admin Access Lost
1. Access database directly
2. Update admin password hash
3. Restart application

### If Bot Not Responding
1. Check backend logs
2. Verify Zalo API credentials
3. Check bot status via `/api/bot/status`

### If WebSocket Issues
1. Check WSS URL configuration
2. Verify firewall settings
3. Check browser console errors

---

## 📞 Support

For deployment issues:
1. Check Render/Railway logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB connection
