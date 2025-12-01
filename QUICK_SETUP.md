# ⚡ Quick Setup - Set API URL trong Vercel

## 🎯 Mục tiêu

Set `VITE_API_URL` trong Vercel để frontend gọi tới Railway backend.

## 🚀 Các bước (2 phút)

### Bước 1: Vào Vercel Dashboard

1. Mở: https://vercel.com/dashboard
2. Chọn **project frontend** của bạn

### Bước 2: Set Environment Variable

1. Vào **Settings** → **Environment Variables**
2. Tìm hoặc tạo biến `VITE_API_URL`
3. Set giá trị:
   ```
   https://logic-production-f1c1.up.railway.app/api
   ```
4. Chọn **Environment**: `Production`, `Preview`, `Development` (hoặc tất cả)
5. Click **Save**

### Bước 3: Redeploy

1. Vào tab **Deployments**
2. Click **"..."** (3 dots) ở deployment mới nhất
3. Chọn **"Redeploy"**
4. Đợi build xong (1-2 phút)

## ✅ Kiểm tra

Sau khi deploy xong:

1. Mở URL của Vercel deployment
2. Mở **Console** (F12)
3. Kiểm tra không có lỗi kết nối API
4. Test một API call (ví dụ: login, search)

## 📝 Lưu ý

- **URL phải có `/api` ở cuối**: `https://logic-production-f1c1.up.railway.app/api`
- **Phải redeploy** sau khi set environment variable
- **Kiểm tra CORS** nếu vẫn lỗi (backend phải allow Vercel domain)

## 🔍 Troubleshooting

### Lỗi: "Cannot connect to API"
- Kiểm tra Railway backend đang chạy: https://logic-production-f1c1.up.railway.app/docs
- Kiểm tra `VITE_API_URL` đã set đúng chưa
- Kiểm tra đã redeploy chưa

### Lỗi: "CORS error"
- Backend cần allow Vercel domain trong `CORS_ORIGINS`
- Set trong Railway: `CORS_ORIGINS=https://your-vercel-app.vercel.app`

