# Hướng dẫn Deploy Frontend lên Vercel

## 📋 Tổng quan

Frontend được deploy trên **Vercel**, backend API được deploy trên **Railway**.

## 🔧 Environment Variables trong Vercel

### Cách set Environment Variables trong Vercel:

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm các biến sau:

### ✅ Các biến môi trường cần thiết:

```env
# Backend API URL (Railway)
VITE_API_URL=https://logic-production-f1c1.up.railway.app/api

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (nếu sử dụng)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Facebook OAuth (nếu sử dụng)
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# Admin API Key (nếu sử dụng admin features)
VITE_ADMIN_API_KEY=your_admin_api_key
```

## ⚠️ Lưu ý quan trọng:

### ❌ KHÔNG dùng Redis URL cho VITE_API_URL

- **`VITE_API_URL`**: URL của backend API (Railway) - ví dụ: `https://your-app.up.railway.app/api`
- **Redis URL**: Chỉ dùng cho backend (Railway), không dùng cho frontend (Vercel)

### ✅ Railway Backend URL:

**Production URL:**
```
https://logic-production-f1c1.up.railway.app/api
```

**Cách lấy Railway Backend URL (nếu cần thay đổi):**

1. Vào Railway Dashboard: https://railway.app
2. Chọn service backend của bạn
3. Tìm public domain ở **Overview** hoặc **Settings** → **Domains**
4. Copy **Public Domain** (ví dụ: `logic-production-f1c1.up.railway.app`)
5. Thêm `/api` vào cuối: `https://logic-production-f1c1.up.railway.app/api`

## 🚀 Deploy Steps:

1. **Push code lên GitHub** (nếu chưa có)
2. **Kết nối với Vercel**:
   - Vào https://vercel.com
   - Click **Add New Project**
   - Import repository từ GitHub
   - Chọn folder `frontend` làm root directory

3. **Set Environment Variables** (như hướng dẫn ở trên)

4. **Deploy**:
   - Vercel sẽ tự động build và deploy
   - Build command: `npm run build`
   - Output directory: `dist`

## 🔍 Kiểm tra sau khi deploy:

1. Vào Vercel Dashboard → **Deployments**
2. Click vào deployment mới nhất
3. Mở URL preview
4. Kiểm tra Console (F12) để đảm bảo không có lỗi kết nối API

## 📝 Example Environment Variables:

```env
# Production
VITE_API_URL=https://logic-production-f1c1.up.railway.app/api
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
```

## 🐛 Troubleshooting:

### Lỗi: "Cannot connect to API"
- Kiểm tra `VITE_API_URL` có đúng URL của Railway backend không
- Đảm bảo Railway backend đã được deploy và đang chạy
- Kiểm tra CORS settings trong backend

### Lỗi: "Supabase connection failed"
- Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
- Đảm bảo Supabase project đang active

### Build failed
- Kiểm tra tất cả environment variables đã được set
- Xem build logs trong Vercel để tìm lỗi cụ thể

