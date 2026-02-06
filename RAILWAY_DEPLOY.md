# =============================================================================
# RAILWAY DEPLOYMENT GUIDE - Eco-product
# =============================================================================

## 📋 Tổng quan
Dự án được cấu hình với **Docker** (Multi-stage build) để tối ưu cho Railway, tương tự mô hình của ContestHub.

## 🚀 Các bước Deploy

### Bước 1: Tạo dự án
1. Chọn **New Project** -> **Deploy from GitHub repo**.
2. Chọn repo `Eco-product`.

### Bước 2: Cấu hình Variables (Quan trọng)
Vào tab **Variables** và set các giá trị sau (tham khảo file `.env.railway`):

| Variable | Giá trị mẫu | Mô tả |
|----------|-------------|-------|
| `NODE_ENV` | `production` | Bắt buộc |
| `DATABASE_URL` | `postgresql://...` | Connection string tới DB của bạn |
| `JWT_SECRET` | `...` | Chuỗi ngẫu nhiên bảo mật (dùng `openssl rand -hex 32`) |
| `FRONTEND_ORIGIN` | `https://eco-product.up.railway.app` | Domain public của app (update sau khi có) |

### Bước 3: Database
1. Trong Railway, bấm **New** -> **Database** -> **Add PostgreSQL** (hoặc dùng external DB).
2. Lấy `CONNECTION_URL` của database và gán vào `DATABASE_URL` của service Eco-product.

### Bước 4: Kiểm tra Deploy
Sau khi Railway build xong (khoảng 2-3 phút), kiểm tra:
- **Build Logs**: Phải có "Done" và không có lỗi đỏ.
- **Deploy Logs**: "Backend listening on http://localhost:..."
- **Public URL**: Truy cập thử URL Railway cấp phát.

## 🐛 Troubleshooting

### Lỗi Database Connection
- Đảm bảo `DATABASE_URL` có đủ user/pass.
- Nếu dùng CockroachDB/Neon, thêm `?sslmode=verify-full` hoặc `?sslmode=require`.

### Lỗi Prisma Client
- Nếu gặp lỗi `libssl`, `openssl`, dự án đã được fix bằng cách thêm `linux-musl-openssl-3.0.x` vào `schema.prisma`. Đảm bảo bạn đã push code mới nhất.

### Lỗi "exports is not defined"
- Dự án đã chuyển sang CommonJS (`backend/package.json` type commonjs). Đảm bảo file này tồn tại.
