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

### Bước 3: Database & Redis (Khuyên dùng)
1. **PostgreSQL**: Trong Railway, bấm **New** -> **Database** -> **Add PostgreSQL**. Lấy `CONNECTION_URL` gán vào `DATABASE_URL`.
2. **Redis**: Bấm **New** -> **Database** -> **Add Redis**. Railway sẽ tự động tạo biến `REDIS_URL`. Hệ thống sẽ tự nhận diện và kích hoạt cache.

### Bước 4.1: Deploy Backend Service
1. Tạo Service mới: **New** -> **GitHub Repo** -> Chọn `Eco-product`.
2. Vào **Settings** -> **Build** -> **Dockerfile Path** -> Nhập `Dockerfile.backend`.
3. Vào **Variables**: Thêm các biến như hướng dẫn ở bước 2 (`DATABASE_URL`, `REDIS_URL`...).
4. Đợi build xong, vào **Settings** -> **Networking** -> **Generate Domain**. (Ví dụ: `eco-backend.up.railway.app`)

### Bước 4.2: Deploy Frontend Service
1. Tạo thêm Service mới (hoặc New project nếu muốn tách hẳn): **New** -> **GitHub Repo** -> Chọn `Eco-product`.
2. Vào **Settings** -> **Build** -> **Dockerfile Path** -> Nhập `Dockerfile.frontend`.
3. Vào **Variables**:
   - `VITE_API_URL`: `https://eco-backend.up.railway.app` (Domain của backend vừa tạo ở trên).
   - *Lưu ý: Frontend chỉ cần biến này, không cần database/redis variables.*
4. Vào **Settings** -> **Networking** -> **Generate Domain**.

### Troubleshooting
- **Frontend không gọi được API?** Kiểm tra xem bạn đã set `VITE_API_URL` chính xác là domain của backend chưa (không có dấu `/` ở cuối nếu code tự thêm, hoặc tùy code của bạn).
- **CORS Error?** Đảm bảo biến `FRONTEND_ORIGIN` ở Backend Service đã điền domain của Frontend Service.
