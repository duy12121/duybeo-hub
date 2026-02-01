# 🤖 Zalo Bot Manager - Full Stack

Hệ thống quản trị bot Zalo với web dashboard, real-time logging, và phân quyền người dùng.

## ⚠️ **CẢNH BÁO BẢO MẬT QUAN TRỌNG**

### 🔐 **KHÔNG BAO GIỜ** dán trực tiếp các thông tin sau vào code:
- `mongodb+srv://...` (MongoDB connection string)
- `GEMINI_API_KEY` (Google AI API key)
- `SECRET_KEY` (JWT secret)
- `ZALO_API_KEY`, `ZALO_SECRET_KEY`, `ZALO_IMEI`, `ZALO_COOKIES`

### 🛡️ **Cách bảo mật đúng:**

#### 1. **MongoDB Connection (MONGO_URI)**
```bash
# ❌ SAI - Đừng làm thế này!
client = AsyncIOMotorClient("mongodb+srv://username:password@cluster.mongodb.net/dbname")

# ✅ ĐÚNG - Dùng biến môi trường
# Trong Render Dashboard -> Environment -> Add Environment Variable
# Key: MONGO_URI
# Value: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

#### 2. **API Keys**
```bash
# Trong Render Dashboard -> Environment:
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_jwt_secret_here
ZALO_API_KEY=your_zalo_api_key
ZALO_SECRET_KEY=your_zalo_secret_key
ZALO_IMEI=your_zalo_imei
ZALO_COOKIES=your_zalo_cookies
```

#### 3. **Local Development (.env file)**
```bash
# Tạo file .env ở thư mục backend
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_jwt_secret_here
ZALO_API_KEY=your_zalo_api_key
ZALO_SECRET_KEY=your_zalo_secret_key
ZALO_IMEI=your_zalo_imei
ZALO_COOKIES=your_zalo_cookies

# ❌ KHÔNG bao giờ commit file .env vào Git!
# Thêm .env vào .gitignore
```

#### 4. **Mongo Atlas Security**
```bash
# ✅ Cấu hình Network Access trong MongoDB Atlas:
# 1. Vào Database -> Connect -> Network Access
# 2. Add IP Address: 0.0.0.0/0 (cho phép tất cả IP)
# 3. Hoặc thêm IP cụ thể của Render: 0.0.0.0/0

# ✅ Cấu hình Database User:
# 1. Vào Database -> Database Access
# 2. Create new user với password mạnh
# 3. Grant quyền read/write cho database cụ thể
```

#### 5. **Render Deployment Security**
```bash
# ✅ Trong Render Dashboard:
# 1. Services -> Backend Service -> Environment
# 2. Add tất cả biến môi trường ở trên
# 3. Bật "Auto-Deploy" để tự động cập nhật khi push code
# 4. Kiểm tra "Health Check Path" = /health
```

---

## ✨ Tính năng

### 🌐 Web Dashboard
- ✅ Đăng nhập & phân quyền (Super Admin, Admin, Moderator, Viewer)
- ✅ Dashboard với thống kê real-time
- ✅ Console với logs real-time (WebSocket)
- ✅ Admin panel quản lý users
- ✅ Control bot từ web (Start/Stop/Restart)

### 🤖 Zalo Bot (17+ Commands)
- ✅ `!bot on` - Bật bot cho nhóm
- ✅ `!bot setup` - Setup admin nhóm
- ✅ `!bot word add/remove` - Quản lý từ cấm
- ✅ `!bot ban/unban` - Ban/unban users
- ✅ `!bot kick` - Kick users khỏi nhóm
- ✅ `!bot block/unblock` - Block users
- ✅ `!bot rule` - Cấu hình nội quy
- ✅ `!bot noiquy` - Xem nội quy nhóm
- ✅ Kiểm tra từ cấm tự động
- ✅ Chống spam
- ✅ Và nhiều hơn nữa...

---

## Cấu trúc

```
zalo-bot-integrated/
├── backend/              # FastAPI + Zalo Bot
│   ├── main.py          # FastAPI server
│   ├── bot_runner.py    # Bot runner với logging
│   ├── bot_integrated.py # Bot logic (17+ commands)
│   ├── bot/
│   │   └── setting.json # Bot configuration
│   ├── models.py        # Data models
│   ├── auth.py          # Authentication
│   └── ...
│
├── frontend/            # React Dashboard
│   ├── src/
│   │   ├── pages/      # Dashboard, Console, Admin
│   │   ├── components/ # UI components
│   │   └── services/   # API & WebSocket
│   └── ...
│
├── Procfile            # Railway deployment
├── railway.json        # Railway config
└── README.md
```

---

## Quick Start

### **Prerequisites:**
- Python 3.8+
- Node.js 16+
- MongoDB (local hoặc Atlas)

### **1. Clone & Setup Backend:**

```bash
cd backend

# Virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup .env
cp .env.example .env
# Edit .env với MongoDB URL, SECRET_KEY, và Zalo credentials

# Run backend
python main.py
```

Backend: `http://localhost:8000`

---

### **2. Setup Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend: `http://localhost:3000`

**Login:** `admin` / `admin123`

---

## 🌐 Deploy Production (FREE)

Xem file **`RAILWAY_DEPLOYMENT.md`** để deploy lên:
- **Backend + Bot**: Railway (FREE $5 credit/tháng)
- **Frontend**: Vercel (FREE unlimited)
- **Database**: MongoDB Atlas (FREE 512MB)

**Total: $0/tháng** 🎉

---

## 📖 Documentation

- **`QUICKSTART.md`** - Hướng dẫn chạy local
- **`RAILWAY_DEPLOYMENT.md`** - Deploy production
- **`BOT_INTEGRATION.md`** - Tích hợp bot chi tiết
- **`DEPLOYMENT.md`** - Deploy options khác

---

## ⚙️ Configuration

### **Backend (.env)**

```env
# MongoDB
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=zalo_bot_manager

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Zalo Bot
ZALO_API_KEY=your-api-key
ZALO_SECRET_KEY=your-secret-key
ZALO_IMEI=your-imei
ZALO_COOKIES={"cookie": "value"}
AUTO_START_BOT=true
```

---

### **Bot (bot/setting.json)**

```json
{
  "admin_bot": ["your-user-id"],
  "allowed_thread_ids": ["group-id-1", "group-id-2"],
  "forbidden_words": ["bad-word-1", "bad-word-2"],
  "rules": {
    "word": {"threshold": 3, "duration": 30},
    "spam": {"threshold": 3, "duration": 30}
  }
}
```

---

## 🎯 Usage

### **Web Dashboard:**

1. Login: `http://localhost:3000`
2. **Dashboard** - Xem stats, control bot
3. **Console** - Xem logs real-time
4. **Admin Panel** - Quản lý users

---

### **Zalo Bot Commands:**

Trong group Zalo:

```
!bot help              # Xem danh sách lệnh
!bot on                # Bật bot cho nhóm
!bot setup on          # Setup bot làm admin
!bot word add cấm      # Thêm từ cấm
!bot word remove cấm   # Xóa từ cấm
!bot ban @user         # Ban user
!bot unban @user       # Unban user
!bot kick @user        # Kick user
!bot block @user       # Block user
!bot rule word 3 30    # Vi phạm 3 lần = khóa mõm 30 phút
!bot noiquy            # Xem nội quy
```

---

## 🔧 Development

### **Backend:**

```bash
cd backend
source venv/bin/activate

# Run with auto-reload
uvicorn main:app --reload

# Test API
curl http://localhost:8000/health
```

---

### **Frontend:**

```bash
cd frontend

# Dev server với HMR
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

---

## 🚀 **DEPLOYMENT GUIDE - HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN**

### 🔥 **DEPLOYMENT TRÊN RENDER (KHUYẾN NGHỊ)**

#### **Bước 1: Chuẩn Bí MongoDB Atlas**
```bash
1. Truy cập: https://cloud.mongodb.com/
2. Đăng ký/Đăng nhập tài khoản MongoDB
3. Create New Project -> Đặt tên: "zalo-bot-manager"
4. Create Cluster:
   - Chọn FREE tier (M0 Sandbox)
   - Region: Singapore (gần Việt Nam nhất)
   - Cluster name: "zalo-bot-cluster"
5. Database Access:
   - Create new user
   - Username: "zalo_bot_user" 
   - Password: tạo password mạnh (ví dụ: "ZaloBot@2024!")
   - Database User Privileges: Read and write to any database
6. Network Access:
   - Add IP Address: 0.0.0.0/0 (cho phép tất cả IP)
   - Hoặc thêm IP của Render: 0.0.0.0/0
7. Get Connection String:
   - Vào Database -> Connect -> Drivers
   - Copy connection string:
   mongodb+srv://zalo_bot_user:ZaloBot@2024!@zalo-bot-cluster.xxxxx.mongodb.net/zalo_bot_manager?retryWrites=true&w=majority
```

#### **Bước 2: Deploy Backend lên Render**
```bash
1. Fork repository này vào GitHub của bạn
2. Đăng nhập https://render.com/
3. New -> Web Service
4. Connect GitHub repository của bạn
5. Cấu hình Web Service:
   - Name: "zalo-bot-backend"
   - Region: Singapore (hoặc Frankfurt)
   - Branch: main
   - Root Directory: backend
   - Runtime: Python 3
   - Build Command: pip install -r requirements.txt
   - Start Command: python main.py
6. Advanced Settings:
   - Health Check Path: /health
   - Auto-Deploy: Bật ON
7. Environment Variables (QUAN TRỌNG NHẤT):
   MONGO_URI=mongodb+srv://zalo_bot_user:ZaloBot@2024!@zalo-bot-cluster.xxxxx.mongodb.net/zalo_bot_manager?retryWrites=true&w=majority
   SECRET_KEY=tạo_random_string_32_ky_tu_đây_là_ví_dụ_abcdef1234567890
   GEMINI_API_KEY=lấy_từ_https://makersuite.google.com/app/apikey
   ZALO_API_KEY=lấy_từ_ứng_dụng_Zalo_API
   ZALO_SECRET_KEY=lấy_từ_ứng_dụng_Zalo_API
   ZALO_IMEI=imei_của_thiết_bị_Zalo
   ZALO_COOKIES={"cookie1":"value1","cookie2":"value2"}
8. Click "Create Web Service"
9. Chờ khoảng 2-3 phút để Render build và deploy
```

#### **Bước 3: Deploy Frontend lên Render**
```bash
1. Trong Render dashboard -> New -> Static Site
2. Connect cùng GitHub repository
3. Cấu hình Static Site:
   - Name: "zalo-bot-frontend"
   - Branch: main
   - Root Directory: frontend
   - Build Command: npm run build
   - Publish Directory: dist
4. Environment Variables:
   VITE_API_URL=https://zalo-bot-backend.onrender.com
5. Click "Create Static Site"
6. Chờ 1-2 phút để build
```

#### **Bước 4: Kiểm Tra Deployment**
```bash
1. Backend Health Check:
   - Mở: https://zalo-bot-backend.onrender.com/health
   - Phải trả về: {"status": "ok"}

2. Frontend Test:
   - Mở: https://zalo-bot-frontend.onrender.com
   - Thử đăng ký tài khoản mới
   - Thử đăng nhập và xem dashboard

3. Bot Test:
   - Vào dashboard -> Start Bot
   - Kiểm tra console logs
   - Test với lệnh !bot help trong Zalo
```

---

### 🐳 **DEPLOYMENT VỚI DOCKER (CHO PRODUCTION)**

#### **Dockerfile cho Backend**
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

#### **Dockerfile cho Frontend**
```dockerfile
# frontend/Dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
      - SECRET_KEY=your_secret_key
      - GEMINI_API_KEY=your_gemini_key
      - ZALO_API_KEY=your_zalo_key
      - ZALO_SECRET_KEY=your_zalo_secret
      - ZALO_IMEI=your_imei
      - ZALO_COOKIES=your_cookies
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

---

### ☁️ **DEPLOYMENT TRÊN CÁC PLATFORM KHÁC**

#### **Railway Deployment**
```bash
1. Fork repo vào GitHub
2. Đăng nhập https://railway.app/
3. New Project -> Deploy from GitHub
4. Chọn repository
5. Railway tự động detect Python app
6. Cấu hình Environment Variables trong tab Variables
7. Add MongoDB service (hoặc dùng external MongoDB Atlas)
8. Deploy và chờ hoàn tất
```

#### **Heroku Deployment**
```bash
1. Cài đặt Heroku CLI
2. Login: heroku login
3. Create app: heroku create zalo-bot-manager
4. Add buildpack:
   heroku buildpacks:set heroku/python
5. Set environment variables:
   heroku config:set MONGO_URI=mongodb+srv://...
   heroku config:set SECRET_KEY=your_secret
   heroku config:set GEMINI_API_KEY=your_gemini_key
   heroku config:set ZALO_API_KEY=your_zalo_key
6. Deploy:
   git push heroku main
```

#### **Vercel (Frontend only)**
```bash
1. Đăng nhập https://vercel.com/
2. New Project -> Import GitHub repository
3. Root Directory: frontend
4. Build Command: npm run build
5. Output Directory: dist
6. Environment Variables:
   VITE_API_URL=https://backend-url.onrender.com
7. Deploy
```

---

### 🔧 **CẤU HÌNH PRODUCTION**

#### **Nginx Configuration (cho Docker)**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name localhost;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### **SSL/TLS Configuration**
```bash
# Cho Render: Tự động có SSL
# Cho custom domain: Cần cấu hình SSL certificate
# Cho Docker: Dùng Let's Encrypt với certbot
```

---

### 📊 **MONITORING & LOGGING**

#### **Health Checks**
```bash
# Backend health endpoint
GET /health
Response: {"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}

# Database connection check
GET /api/health/db
Response: {"database": "connected", "collections": 5}
```

#### **Logging Configuration**
```python
# Trong production, cấu hình logging level
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

### 🚨 **TROUBLESHOOTING DEPLOYMENT**

#### **Common Issues & Solutions**

**1. MongoDB Connection Failed**
```bash
- Kiểm tra MONGO_URI có đúng không
- Network Access trong MongoDB Atlas có IP 0.0.0.0/0 không
- Database user có quyền read/write không
```

**2. Bot Not Starting**
```bash
- Kiểm tra ZALO_API_KEY và ZALO_SECRET_KEY
- ZALO_IMEI và ZALO_COOKIES có valid không
- Bot có bị banned không
```

**3. Frontend Cannot Connect to Backend**
```bash
- Kiểm tra VITE_API_URL có đúng không
- CORS có được config đúng không
- Backend có running không
```

**4. AI Not Working**
```bash
- Kiểm tra GEMINI_API_KEY có valid không
- Có quota còn không
- Network có bị chặn không
```

---

### 🔄 **CI/CD PIPELINE**

#### **GitHub Actions (Auto Deploy)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 📊 Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- Motor - Async MongoDB driver
- WebSocket - Real-time communication
- JWT - Authentication
- zlapi - Zalo API wrapper

**Frontend:**
- React 18 - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- React Router - Routing
- Recharts - Charts
- Axios - HTTP client

**Database:**
- MongoDB Atlas - Cloud NoSQL database

---

## 🐛 Troubleshooting

### **Bot không start:**

```python
# Check zlapi installed
pip list | grep zlapi

# Check credentials in .env
cat .env | grep ZALO
```

---

### **WebSocket không connect:**

```javascript
// Check WebSocket URL
console.log(import.meta.env.VITE_WS_URL)

// Check CORS
// Backend .env phải có frontend URL
```

---

### **MongoDB connection failed:**

```bash
# Test connection
mongosh "your-connection-string"

# Check .env
cat backend/.env | grep MONGODB_URL
```

---

## 📝 License

MIT License - Free to use for personal and commercial projects.

---

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

---

## 📞 Support

- 📧 Email: namduyluong304@gmail.com
- 💬 Discord: non
- 📖 Docs: non

---

**Made with ❤️ for Zalo Bot Management**

⭐ Star repo nếu thấy hữu ích!
