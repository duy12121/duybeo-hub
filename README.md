# 🤖 Zalo Bot Manager - Full Stack

Hệ thống quản trị bot Zalo với web dashboard, real-time logging, và phân quyền người dùng.

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

## 🏗️ Kiến trúc

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

## 🚀 Quick Start

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
