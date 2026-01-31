# ⚡ Quick Start Guide

## 🚀 Chạy Local (5 phút)

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (hoặc dùng MongoDB Atlas free)

### Bước 1: Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download tại: https://www.mongodb.com/try/download/community

**Hoặc dùng MongoDB Atlas (Free):**
1. Đăng ký tại https://www.mongodb.com/cloud/atlas
2. Tạo free cluster
3. Lấy connection string
4. Cập nhật `backend/.env`

### Bước 2: Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate
# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env nếu cần (hoặc dùng mặc định cho local)

# Run backend
python main.py
```

Backend chạy tại: **http://localhost:8000**

### Bước 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend chạy tại: **http://localhost:3000**

### Bước 4: Login

1. Mở http://localhost:3000
2. Login với:
   - Username: `admin`
   - Password: `admin123`

✅ Done! Bạn đã có hệ thống chạy!

---

## 🤖 Tích hợp Bot

### Copy module vào bot của bạn:

```bash
cp bot-integration/bot_client.py /path/to/your/bot/
```

### Sử dụng trong bot:

```python
from bot_client import BotManagerClient

# Initialize
bot_manager = BotManagerClient(
    api_url="http://localhost:8000",
    api_key="your-bot-api-key"
)

# Log activities
bot_manager.info("Bot started")
bot_manager.info("Message received", details={
    "user_id": "123",
    "message": "Hello"
})
```

---

## 🎯 One-Click Start (Recommended)

### Linux/macOS:
```bash
chmod +x start.sh
./start.sh
```

### Windows:
```cmd
start.bat
```

Script sẽ tự động:
- ✅ Start MongoDB
- ✅ Start Backend
- ✅ Start Frontend
- ✅ Open browser

---

## 🌐 Deploy Production (Free)

Xem file `DEPLOYMENT.md` để deploy lên:
- **Backend**: Render.com (Free)
- **Frontend**: Vercel (Free)  
- **Database**: MongoDB Atlas (Free)

Deploy time: ~10 phút

---

## 📚 Documentation

- **README.md** - Tổng quan dự án
- **DEPLOYMENT.md** - Hướng dẫn deploy production
- **BOT_INTEGRATION.md** - Hướng dẫn tích hợp bot chi tiết

---

## 🆘 Troubleshooting

### Backend không start?
```bash
# Check Python version
python --version  # Phải >= 3.8

# Check MongoDB
mongosh  # Hoặc mongo

# Check dependencies
pip list
```

### Frontend không start?
```bash
# Check Node version
node --version  # Phải >= 16

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Không connect được?
- Check backend chạy tại port 8000
- Check frontend chạy tại port 3000
- Check MongoDB đang chạy

---

## 📞 Need Help?

1. Check README.md
2. Check logs trong terminal
3. Open Issue trên GitHub

---

## 🎨 Features

✅ Đăng nhập & Phân quyền
✅ Dashboard với stats real-time
✅ Console với logs real-time (WebSocket)
✅ Admin panel quản lý users
✅ Bot integration module
✅ Responsive design
✅ Dark theme
✅ Export logs
✅ 100% FREE deployment

---

**Enjoy! 🚀**
