# 🚀 Hướng dẫn Deploy lên Railway (FREE)

## 📋 Tổng quan

Hệ thống gồm:
- **Backend FastAPI** - Web API + Zalo Bot chạy cùng nhau
- **Frontend React** - Deploy riêng trên Vercel
- **MongoDB Atlas** - Database cloud (FREE)

---

## 1️⃣ Chuẩn bị

### **A. MongoDB Atlas (Database)**

Đã có từ setup local! Chỉ cần connection string từ file `.env`

---

### **B. Tạo tài khoản Railway**

1. Vào https://railway.app
2. Sign up bằng GitHub
3. Verify email

**Free tier:**
- $5 credit/tháng
- 500 hours runtime
- 1GB RAM
- 1GB storage

---

## 2️⃣ Deploy Backend + Bot lên Railway

### **Bước 1: Push code lên GitHub**

```bash
# Trong thư mục zalo-bot-integrated

git init
git add .
git commit -m "Initial commit: Zalo Bot + Web Dashboard"
git branch -M main

# Tạo repo trên GitHub (https://github.com/new)
# Đặt tên: zalo-bot-manager

git remote add origin https://github.com/YOUR_USERNAME/zalo-bot-manager.git
git push -u origin main
```

---

### **Bước 2: Deploy trên Railway**

1. **Login Railway**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Chọn repo**: `zalo-bot-manager`
4. Railway tự động detect và build!

---

### **Bước 3: Cấu hình Environment Variables**

Click vào project → **Variables** tab → Add variables:

```env
# MongoDB (từ MongoDB Atlas)
MONGODB_URL=mongodb+srv://duybeo123:yourpassword@quanbot.o5w3ca1.mongodb.net/?appName=quanbot
DATABASE_NAME=zalo_bot_manager

# JWT Secret (generate mới)
SECRET_KEY=<paste SECRET_KEY từ local .env>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS - Add Railway domain sau khi deploy
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Bot API Key
BOT_API_KEY=zalobot-railway-2024

# ZALO BOT CONFIG - QUAN TRỌNG!
ZALO_API_KEY=<your-zalo-api-key>
ZALO_SECRET_KEY=<your-zalo-secret-key>
ZALO_IMEI=<your-imei>
ZALO_COOKIES=<your-cookies-json>
AUTO_START_BOT=true
```

**Lấy Zalo credentials từ đâu?**
- Từ file `bot_info.py` dòng 1071-1072
- IMEI & cookies bạn đã dùng local

---

### **Bước 4: Deploy**

Railway tự động deploy! Đợi 2-5 phút.

**Check logs:**
- Click vào deployment → **Logs** tab
- Thấy: `Uvicorn running on http://0.0.0.0:8000`
- Thấy: `Bot started successfully`

**Lấy URL:**
- Click **Settings** → **Domains**
- Railway tự tạo: `https://your-app.up.railway.app`
- Hoặc add custom domain

---

## 3️⃣ Deploy Frontend lên Vercel

### **Bước 1: Cấu hình API URL**

Tạo file `frontend/.env.production`:

```env
VITE_API_URL=https://your-app.up.railway.app
VITE_WS_URL=wss://your-app.up.railway.app
```

---

### **Bước 2: Push lên GitHub**

```bash
git add .
git commit -m "Add production config"
git push
```

---

### **Bước 3: Deploy Vercel**

**Option A: Vercel CLI**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

**Option B: Vercel Dashboard**
1. https://vercel.com → New Project
2. Import `zalo-bot-manager` repo
3. **Root Directory**: `frontend`
4. **Framework Preset**: Vite
5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   VITE_WS_URL=wss://your-app.up.railway.app
   ```
6. Deploy!

---

### **Bước 4: Update CORS**

Sau khi có Vercel URL (VD: `https://zalo-bot.vercel.app`):

1. Quay lại **Railway**
2. **Variables** → Edit `CORS_ORIGINS`
3. Thêm Vercel URL:
   ```
   CORS_ORIGINS=http://localhost:3000,https://zalo-bot.vercel.app
   ```
4. Save → Railway auto redeploy

---

## 4️⃣ Test hệ thống

### **Backend + Bot:**
```
https://your-app.up.railway.app/health
```

Phải thấy: `{"status":"healthy"}`

### **API Docs:**
```
https://your-app.up.railway.app/docs
```

### **Frontend:**
```
https://zalo-bot.vercel.app
```

Login: `admin` / `admin123`

### **Check Bot Logs:**

Vào Console tab → Thấy logs real-time từ bot!

---

## 5️⃣ Kiểm tra Bot hoạt động

**Trong Railway logs:**
```
Bot started successfully
Connected to MongoDB
```

**Trong Web Dashboard:**
- Dashboard → Bot Status: ✅ Running
- Console → Thấy logs từ bot

**Test trong Zalo:**
- Gửi `!bot help` vào group
- Bot reply → Log hiện trên dashboard!

---

## 🔧 Troubleshooting

### **Bot không start:**

Check Railway logs:
```
Error: zlapi not found
```

→ Install zlapi: Thêm vào `requirements.txt`

---

### **Bot start nhưng không hoạt động:**

Check credentials:
- ZALO_API_KEY đúng?
- ZALO_COOKIES đúng format?
- IMEI đúng?

---

### **Frontend không connect backend:**

Check:
1. CORS_ORIGINS có Vercel URL?
2. VITE_API_URL đúng Railway URL?
3. Railway app đang chạy?

---

## 📊 Cost Breakdown (FREE!)

| Service | Cost | Limits |
|---------|------|--------|
| **Railway** | $0 | $5 credit/tháng (đủ chạy 24/7) |
| **Vercel** | $0 | Unlimited deploys |
| **MongoDB Atlas** | $0 | 512MB storage |
| **Total** | **$0/tháng** | 🎉 |

---

## 🎯 Production Tips

### **1. Security:**

```env
# Generate strong SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Không commit .env lên GitHub!
# Thêm vào .gitignore:
echo ".env" >> .gitignore
echo "bot/setting.json" >> .gitignore
```

---

### **2. Monitoring:**

**Railway Dashboard:**
- Metrics → CPU, RAM, Network usage
- Logs → Real-time logs
- Deployments → History

**Web Dashboard:**
- Console → Bot activity logs
- Dashboard → Stats

---

### **3. Backup:**

**Database:** MongoDB Atlas auto backup

**Bot settings:**
```bash
# Download setting.json from Railway
railway run cat backend/bot/setting.json > setting.json.backup
```

---

### **4. Updates:**

```bash
# Push code changes
git add .
git commit -m "Update: ..."
git push

# Railway auto redeploy!
# Vercel auto redeploy frontend!
```

---

## 🆘 Support

**Railway Issues:**
- https://railway.app/help
- Discord: https://discord.gg/railway

**Vercel Issues:**
- https://vercel.com/support

**MongoDB Atlas:**
- https://www.mongodb.com/support

---

## ✅ Checklist

- [ ] MongoDB Atlas đã setup
- [ ] Code đã push lên GitHub
- [ ] Railway project đã tạo
- [ ] Environment variables đã set
- [ ] Backend deployed thành công
- [ ] Frontend deployed lên Vercel
- [ ] CORS đã update
- [ ] Bot đang chạy
- [ ] Login web thành công
- [ ] Logs hiển thị trên dashboard

---

**Chúc mừng! Hệ thống đã online 24/7 miễn phí! 🎊**
