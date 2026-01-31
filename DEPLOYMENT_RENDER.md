# Hướng Dẫn Deploy Lên Render.com

Hướng dẫn này giúp bạn deploy ứng dụng Zalo Bot Manager từ GitHub lên Render.com (backend + frontend).

---

## 📋 Điều Kiện Tiên Quyết

1. **GitHub Account** - Với repository đã push code
2. **Render.com Account** - Đăng ký miễn phí tại [render.com](https://render.com)
3. **MongoDB Atlas Account** - Database cloud miễn phí tại [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)

---

## ✅ Bước 1: Chuẩn Bị Code Trên GitHub

### 1.1 Ensure Dependencies
Thêm `uvicorn[standard]` vào `backend/requirements.txt` nếu chưa có:

```bash
pip install uvicorn[standard]
pip freeze > backend/requirements.txt
```

Hoặc edit thủ công thêm dòng này vào `backend/requirements.txt`:
```
uvicorn[standard]==0.27.0
```

### 1.2 Kiểm tra các file cấu hình

Đảm bảo bạn đã có:
- ✅ `Procfile` (đã được update)
- ✅ `render.yaml` (tự động cấu hình services)
- ✅ `runtime.txt` (Python 3.11)
- ✅ `.gitignore` (chứa `__pycache__/`, `.env`, `node_modules/`)

### 1.3 Push lên GitHub

```bash
cd c:\Users\duy\Desktop\zalo-bot-integrated
git add .
git commit -m "prepare for render deployment"
git push origin main
```

---

## 🚀 Bước 2: Cấu Hình Database (MongoDB Atlas)

### 2.1 Tạo Cluster
1. Đăng nhập [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create** → **New Project** (tên: `zalo-bot`)
3. **Create Deployment** → chọn **Free M0**
4. Chọn **Cloud Provider**: AWS, **Region**: ap-southeast-1 (Singapore)
5. **Create Cluster** (chờ ~3-5 phút)

### 2.2 Cấu Hình Network & User
1. **Database Access** → **Add New Database User**
   - Username: `zalobot_user`
   - Password: (sinh tự động) - **copy lưu lại**
   - Role: `readWriteAnyDatabase`

2. **Network Access** → **Add IP Address**
   - Chọn **Allow from anywhere** (0.0.0.0/0) - Render.com có IP động

### 2.3 Lấy Connection String
1. **Clusters** → **Connect**
2. Chọn **Drivers** → **Python 3.6+**
3. Copy connection string, ví dụ:
   ```
   mongodb+srv://zalobot_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Thay `<password>` bằng password đã tạo

---

## 🔧 Bước 3: Deploy Backend Trên Render.com

### 3.1 Tạo Web Service
1. Đăng nhập [Render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect repository** → chọn repository GitHub của bạn
   - Nếu lần đầu, cấp quyền GitHub access
4. Điền thông tin:
   - **Name**: `zalo-bot-api`
   - **Region**: Oregon (gần nhất)
   - **Branch**: `main` (hoặc branch của bạn)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (hoặc Starter nếu muốn)

### 3.2 Cấu Hình Environment Variables
Trong tab **Environment**:

| Key | Value | Ghi Chú |
|-----|-------|---------|
| `MONGODB_URL` | `mongodb+srv://zalobot_user:<password>@cluster0.xxxxx.mongodb.net/zalo_bot_manager?retryWrites=true&w=majority` | Lấy từ MongoDB Atlas |
| `DATABASE_NAME` | `zalo_bot_manager` | Default từ config.py |
| `SECRET_KEY` | (sinh ngẫu nhiên) | `openssl rand -hex 32` |
| `ZALO_API_KEY` | (từ Zalo Platform) | API key Zalo |
| `ZALO_SECRET_KEY` | (từ Zalo Platform) | Secret key Zalo |
| `ZALO_IMEI` | (IMEI của thiết bị) | IMEI device |
| `ZALO_COOKIES` | (JSON cookies) | `'{"c1": "value1", ...}'` |
| `AUTO_START_BOT` | `false` | Khởi động tự động |
| `CORS_ORIGINS` | `https://zalo-bot.onrender.com` | Frontend URL (thêm sau) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24 giờ |

### 3.3 Deploy
1. Scroll xuống **Create Web Service**
2. Chờ build & deploy (5-10 phút)
3. Khi thấy "Your service is live!", lấy URL: `https://zalo-bot-api.onrender.com`

---

## 🎨 Bước 4: Deploy Frontend Trên Render.com

### 4.1 Tạo Static Site
1. **New** → **Static Site**
2. **Connect repository** → chọn repository
3. Điền thông tin:
   - **Name**: `zalo-bot-web`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

### 4.2 Cấu Hình Environment Variables
Trong tab **Environment**, thêm:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://zalo-bot-api.onrender.com` |
| `VITE_WS_URL` | `wss://zalo-bot-api.onrender.com` |

### 4.3 Deploy
1. **Create Static Site**
2. Chờ build (5-10 phút)
3. Frontend URL: `https://zalo-bot-web.onrender.com`

---

## 🔄 Bước 5: Cập Nhật CORS Trên Backend

Quay lại **Backend Service** (zalo-bot-api):
1. **Environment** → Edit
2. Cập nhật `CORS_ORIGINS`:
   ```
   https://zalo-bot-web.onrender.com,http://localhost:3000
   ```
3. **Save** → Service tự động redeploy

---

## ✨ Bước 6: Kiểm Tra & Test

### 6.1 Check Backend
```bash
curl https://zalo-bot-api.onrender.com/docs
```
Nếu thấy Swagger UI → Backend OK ✅

### 6.2 Truy Cập Frontend
1. Mở https://zalo-bot-web.onrender.com
2. Login: `admin` / `admin123` (default)
3. Thay đổi password trong Settings

### 6.3 Check Logs
- **Backend**: Render → zalo-bot-api → **Logs**
- **Frontend**: Render → zalo-bot-web → **Logs**

---

## 🐛 Troubleshooting

### Backend không start
```
ERROR: Cannot find module 'uvicorn'
```
**Fix**: Thêm `uvicorn[standard]` vào `backend/requirements.txt`

### CORS Error
```
Access to XMLHttpRequest blocked by CORS
```
**Fix**: Cập nhật `CORS_ORIGINS` env var với frontend URL

### MongoDB Connection Error
```
Timeout connecting to server
```
**Fix**: 
- Kiểm tra connection string trong MongoDB Atlas
- Ensure "Allow from anywhere" (0.0.0.0/0) đã được set

### Frontend không load data
```
Failed to fetch from /api/...
```
**Fix**: 
- Kiểm tra `VITE_API_URL` env var trỏ đúng backend URL
- Chạy `npm run build` lại

---

## 📝 Sử Dụng render.yaml (Optional)

Nếu muốn quản lý cấu hình tập trung, bạn có thể dùng `render.yaml`:

```bash
# Thay vì tạo service bằng UI, push render.yaml lên
# Render sẽ tự động tạo services theo config này
```

---

## 🔐 Bảo Mật (Important!)

**KHÔNG** push `.env` lên GitHub!
- Các secrets nên set trên Render dashboard
- Hoặc dùng GitHub Secrets + Render environment variables

```bash
# .gitignore
.env
.env.local
__pycache__/
node_modules/
dist/
*.pyc
```

---

## 📊 Monitoring & Logs

### Xem Logs Real-time
**Render Dashboard** → Service → **Logs** tab

### CPU/Memory Usage
**Render Dashboard** → Service → **Metrics** tab

---

## 🔄 Update Code & Redeploy

Sau khi push code mới lên GitHub:

```bash
git add .
git commit -m "update feature"
git push origin main
```

Render sẽ **tự động detect** và redeploy (nếu auto-deploy được enable).

---

## 💡 Tips & Tricks

1. **Free tier limitations**:
   - 15 phút idle → service spin down
   - Spin up lại mất 30-50 giây
   - Nếu muốn 24/7, upgrade lên Starter ($7/tháng)

2. **Custom Domain**:
   - Render → Service → Settings → Custom Domain
   - Add `your-domain.com` (yêu cầu update DNS records)

3. **Automated Deployments**:
   - Render → Deployments → Enable auto-deploy from GitHub

---

## 🎯 Checklist Deploy

- [ ] Push code lên GitHub
- [ ] MongoDB Atlas cluster + user + connection string
- [ ] Backend: Web Service created + env vars set
- [ ] Frontend: Static Site created + env vars set  
- [ ] Backend deployed & `/docs` accessible
- [ ] Frontend deployed & loads
- [ ] Login test với admin/admin123
- [ ] CORS_ORIGINS updated
- [ ] Custom domain (optional)

---

**Xong!** 🚀 Ứng dụng của bạn giờ đã live trên Render.com
