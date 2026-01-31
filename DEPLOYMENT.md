# 🚀 Hướng dẫn Deploy (100% MIỄN PHÍ)

## 🎯 Tổng quan

Chúng ta sẽ deploy:
- **Backend (FastAPI)** → Render.com (Free)
- **Frontend (React)** → Vercel (Free)
- **Database (MongoDB)** → MongoDB Atlas (Free)

Tất cả đều MIỄN PHÍ VĨNH VIỄN! 🎉

---

## 1️⃣ Deploy Database - MongoDB Atlas

### Bước 1: Tạo tài khoản
1. Truy cập https://www.mongodb.com/cloud/atlas
2. Đăng ký tài khoản (email + password)
3. Chọn FREE tier (M0 Sandbox - 512MB)

### Bước 2: Tạo Cluster
1. Chọn Cloud Provider: **AWS** (hoặc Google Cloud)
2. Chọn Region gần Việt Nam nhất: **Singapore (ap-southeast-1)**
3. Cluster Name: `zalo-bot-cluster`
4. Click **Create**

### Bước 3: Tạo Database User
1. Security → Database Access → Add New Database User
2. Username: `zalobot`
3. Password: Tạo password mạnh (lưu lại!)
4. Database User Privileges: **Read and write to any database**
5. Add User

### Bước 4: Whitelist IP
1. Security → Network Access → Add IP Address
2. Chọn **Allow Access from Anywhere** (0.0.0.0/0)
3. Confirm

### Bước 5: Lấy Connection String
1. Database → Connect → Connect your application
2. Driver: **Python** / Version: **3.12 or later**
3. Copy connection string:
   ```
   mongodb+srv://zalobot:<password>@zalo-bot-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Thay `<password>` bằng password đã tạo

✅ Done! Lưu connection string này.

---

## 2️⃣ Deploy Backend - Render.com

### Bước 1: Push code lên GitHub
```bash
cd zalo-bot-manager
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/zalo-bot-manager.git
git push -u origin main
```

### Bước 2: Tạo tài khoản Render
1. Truy cập https://render.com
2. Sign up với GitHub
3. Authorize Render

### Bước 3: Tạo Web Service
1. Dashboard → New → Web Service
2. Connect Repository: Chọn `zalo-bot-manager`
3. Configure:

   **Basic Settings:**
   - Name: `zalo-bot-manager-api`
   - Region: **Singapore** (gần VN)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: **Python 3**
   
   **Build & Deploy:**
   - Build Command:
     ```bash
     pip install -r requirements.txt
     ```
   - Start Command:
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

4. **Environment Variables** (Click "Add Environment Variable"):
   ```
   MONGODB_URL=mongodb+srv://zalobot:yourpassword@...
   DATABASE_NAME=zalo_bot_manager
   SECRET_KEY=<generate-random-32-chars>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
   BOT_API_KEY=your-bot-api-key-here
   ```

   **Generate SECRET_KEY:**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

5. Select **Free Plan**
6. Click **Create Web Service**

### Bước 4: Đợi deploy
- Render sẽ build và deploy (3-5 phút)
- URL của bạn: `https://zalo-bot-manager-api.onrender.com`
- Check logs để đảm bảo không có lỗi

✅ Backend done!

---

## 3️⃣ Deploy Frontend - Vercel

### Bước 1: Chuẩn bị code
1. Update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://zalo-bot-manager-api.onrender.com
   VITE_WS_URL=wss://zalo-bot-manager-api.onrender.com
   ```

2. Update `backend/config.py` - thêm Vercel domain vào CORS:
   ```python
   cors_origins: str = "http://localhost:3000,https://your-app.vercel.app"
   ```

3. Commit changes:
   ```bash
   git add .
   git commit -m "Add production config"
   git push
   ```

### Bước 2: Deploy với Vercel

**Option A: Vercel CLI (Nhanh nhất)**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

**Option B: Vercel Dashboard**
1. Truy cập https://vercel.com
2. Sign up với GitHub
3. New Project → Import `zalo-bot-manager`
4. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables:
   ```
   VITE_API_URL=https://zalo-bot-manager-api.onrender.com
   VITE_WS_URL=wss://zalo-bot-manager-api.onrender.com
   ```
6. Deploy!

### Bước 3: Cập nhật CORS
1. Lấy URL Vercel của bạn: `https://your-app.vercel.app`
2. Quay lại Render → Environment → Edit `CORS_ORIGINS`:
   ```
   http://localhost:3000,https://your-app.vercel.app
   ```
3. Save changes → Render sẽ tự động redeploy

✅ Frontend done!

---

## 4️⃣ Kiểm tra & Test

### Test Backend
```bash
curl https://zalo-bot-manager-api.onrender.com/health
# Output: {"status":"healthy","timestamp":"..."}
```

### Test Frontend
1. Truy cập `https://your-app.vercel.app`
2. Login với `admin` / `admin123`
3. Kiểm tra Dashboard, Console, Admin Panel

### Test WebSocket
1. Mở Console tab
2. Kiểm tra real-time logs
3. F12 → Console → không có lỗi WebSocket

---

## 5️⃣ Connect Bot của bạn

### Update bot code:
```python
from bot_client import BotManagerClient

bot_manager = BotManagerClient(
    api_url="https://zalo-bot-manager-api.onrender.com",
    api_key="your-bot-api-key-here"  # Phải khớp với backend
)

# Log activities
bot_manager.info("Bot started from my machine!")
```

### Test:
```python
python your_bot.py
```

Kiểm tra Console trong web app - logs sẽ hiện real-time! 🎉

---

## 🎊 DONE!

Giờ bạn đã có:
- ✅ Backend API chạy 24/7 miễn phí
- ✅ Frontend web app với custom domain
- ✅ Database cloud miễn phí
- ✅ Real-time logging
- ✅ Hoàn toàn MIỄN PHÍ!

---

## 🔧 Maintenance

### Auto Deploy
- **Frontend (Vercel)**: Tự động deploy khi push lên `main` branch
- **Backend (Render)**: Tự động deploy khi push lên `main` branch

### Giới hạn Free Tier

**Render.com:**
- ✅ 750 giờ/tháng (đủ chạy 1 app 24/7)
- ⚠️ App sleep sau 15 phút không hoạt động
- ⚠️ Cold start: 30s-1 phút khi wake up

**Giải pháp:**
- Dùng cron job để ping app mỗi 10 phút
- Hoặc upgrade lên paid plan ($7/tháng)

**Vercel:**
- ✅ Bandwidth: 100GB/tháng
- ✅ Builds: Unlimited
- ✅ Không giới hạn requests

**MongoDB Atlas:**
- ✅ Storage: 512MB
- ✅ Connections: 500
- ✅ Đủ cho 1000+ users

### Keep App Awake (Optional)

Tạo cron job để ping app:

**Cách 1: Cron-job.org (Free)**
1. Đăng ký tại https://cron-job.org
2. Tạo job: GET `https://zalo-bot-manager-api.onrender.com/health`
3. Schedule: Every 10 minutes

**Cách 2: UptimeRobot (Free)**
1. Đăng ký tại https://uptimerobot.com
2. Add Monitor: `https://zalo-bot-manager-api.onrender.com/health`
3. Check interval: 5 minutes

---

## 🆘 Troubleshooting

### Backend không start
1. Check logs trên Render Dashboard
2. Kiểm tra Environment Variables đúng chưa
3. Test MongoDB connection string

### Frontend không connect backend
1. Check CORS_ORIGINS trong backend
2. Verify VITE_API_URL đúng
3. Check Network tab trong F12

### WebSocket không hoạt động
1. Đảm bảo dùng `wss://` (không phải `ws://`)
2. Check Render logs
3. Verify CORS settings

### Bot không gửi logs
1. Check BOT_API_KEY khớp
2. Verify network connectivity
3. Check bot logs

---

## 🎯 Production Tips

1. **Security:**
   ```python
   # Đổi SECRET_KEY
   # Đổi admin password
   # Enable HTTPS only
   ```

2. **Performance:**
   ```python
   # Add database indexes
   # Use connection pooling
   # Cache frequently accessed data
   ```

3. **Monitoring:**
   - Setup error tracking (Sentry)
   - Monitor uptime (UptimeRobot)
   - Track performance (New Relic free tier)

---

## 📞 Need Help?

- 📧 Email: support@example.com
- 💬 Discord: YourServer
- 📖 Docs: https://docs.example.com

Happy coding! 🚀
