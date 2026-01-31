# Tính Năng Đăng Ký Người Dùng

## 📋 Tóm Tắt

Đã thêm tính năng **đăng ký tài khoản** cho phép người ngoài có thể tạo tài khoản mới để sử dụng hệ thống Zalo Bot Manager.

## ✅ Những Gì Được Thêm

### Backend (Python/FastAPI)

#### 1. Endpoint Đăng Ký: `POST /api/auth/register`
```python
@app.post("/api/auth/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
```

**Chức năng:**
- Nhận dữ liệu đăng ký: `username`, `email`, `password`, `full_name`
- Kiểm tra username không trùng lặp
- Kiểm tra email không trùng lặp
- Mã hóa password bằng bcrypt
- Tạo user mới với role `viewer` (quyền thấp nhất, an toàn cho người dùng mới)
- Trả về thông tin user đã tạo

**Xử lý lỗi:**
- `400 Bad Request` - Username hoặc email đã tồn tại

### Frontend (React)

#### 1. Trang Register: `pages/Register.jsx`
```
/register
```

**Tính năng:**
- Form đăng ký với các trường:
  - ✓ Tên đăng nhập (bắt buộc, tối thiểu 3 ký tự)
  - ✓ Email (bắt buộc, kiểm tra format)
  - ✓ Mật khẩu (bắt buộc, tối thiểu 6 ký tự)
  - ✓ Xác nhận mật khẩu (bắt buộc, phải khớp)
  - ✓ Tên đầy đủ (tùy chọn)
- Kiểm tra dữ liệu phía client trước khi gửi
- Hiển thị thông báo lỗi chi tiết
- Sau khi đăng ký thành công: tự động đăng nhập và chuyển hướng đến Dashboard
- Link về trang Login

#### 2. Cập Nhật Trang Login
- Thêm link "Đăng ký ngay" ở dưới form Login
- Người dùng có thể chuyển từ Login → Register

#### 3. Cập Nhật API Service
```javascript
authAPI.register(username, email, password, fullName)
```

#### 4. Cập Nhật Routing
- Thêm route `/register` trong `App.jsx`
- Import component `Register` trong App

## 🔒 Bảo Mật

- **Password hashing**: Sử dụng bcrypt (cùng với login)
- **Validation**: Kiểm tra username/email không trùng lặp
- **Default Role**: User mới được gán role `viewer` (không có quyền admin)
- **Email validation**: Kiểm tra format email hợp lệ

## 📊 Luồng Đăng Ký

```
User truy cập /register
    ↓
Điền form (username, email, password, ...)
    ↓
Nhấn "Đăng ký"
    ↓
Kiểm tra dữ liệu phía client
    ↓
POST /api/auth/register
    ↓
Backend kiểm tra:
  - Username không tồn tại?
  - Email không tồn tại?
    ↓
Tạo user mới
  - Mã hóa password
  - Gán role: "viewer"
  ↓
Trả về thông tin user
  ↓
Tự động đăng nhập (call login)
  ↓
Lưu token vào localStorage
  ↓
Chuyển hướng đến Dashboard
```

## 🎯 Quyền Hạn Của User Mới

Người dùng mới được tạo với role `viewer`:
- ✓ Xem Dashboard
- ✓ Xem Console logs
- ✓ Xem danh sách users (view only)
- ✗ Không thể tạo/sửa/xóa users
- ✗ Không thể control bot
- ✗ Không thể chỉnh cấu hình

## 📝 Validation Rules

### Username
- Tối thiểu 3 ký tự
- Không được trùng với user khác
- Dùng để đăng nhập

### Email
- Phải là email hợp lệ
- Không được trùng với user khác
- Có thể dùng cho password reset (trong tương lai)

### Password
- Tối thiểu 6 ký tự
- Phải xác nhận (nhập 2 lần giống nhau)
- Được mã hóa bằng bcrypt trước lưu

## 🔗 File Được Sửa/Tạo

### Tạo mới:
- `frontend/src/pages/Register.jsx` - Trang đăng ký

### Sửa:
- `backend/main.py` - Thêm endpoint `/api/auth/register`
- `frontend/src/services/api.js` - Thêm method `authAPI.register()`
- `frontend/src/pages/Login.jsx` - Thêm link đến Register
- `frontend/src/App.jsx` - Thêm route `/register`

## 🚀 Cách Sử Dụng

### Cho người dùng mới:
1. Vào trang web, nhấn "Đăng ký ngay" trên trang Login
2. Điền thông tin: username, email, password
3. Nhấn "Đăng ký"
4. Tự động đăng nhập và vào Dashboard

### Cho admin (quản lý users):
1. Vào Admin Panel
2. Có thể nâng cấp role của user từ `viewer` → `moderator` hoặc `admin`
3. Hoặc xóa user nếu cần

## ⚠️ Lưu Ý

- User mới được tạo với role `viewer` để an toàn
- Admin cần qua Admin Panel để cấp quyền cao hơn
- Không có tính năng email verification hiện tại (có thể thêm sau)
- Không có password reset (có thể thêm sau)

## 🔄 Lần Sau Có Thể Thêm

- [ ] Email verification khi đăng ký
- [ ] Password reset via email
- [ ] OAuth login (Google, GitHub, v.v.)
- [ ] Two-factor authentication (2FA)
- [ ] User profile page
- [ ] Change password page

---

**Status**: ✅ Hoàn thành  
**Date**: 2024-01-30  
**Version**: 1.0

