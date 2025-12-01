# 🔧 Fix 404 Error - Missing /api Prefix

## ✅ Tin tốt: Redirect loop đã được fix!

Bây giờ không còn `ERR_TOO_MANY_REDIRECTS` nữa, nhưng có lỗi **404 Not Found** vì thiếu `/api` prefix.

## 🔍 Vấn đề

Từ error logs:
- ❌ `https://logic-production-f1c1.up.railway.app/vehicles/featured` → 404
- ✅ Đúng phải là: `https://logic-production-f1c1.up.railway.app/api/vehicles/featured`

## 🚀 Giải pháp

### Bước 1: Kiểm tra VITE_API_URL trong Vercel

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn **project frontend** của bạn
3. Vào **Settings** → **Environment Variables**
4. Tìm biến `VITE_API_URL`

### Bước 2: Set đúng giá trị

**Giá trị đúng:**
```
https://logic-production-f1c1.up.railway.app/api
```

**Lưu ý:**
- ✅ Phải có `/api` ở cuối
- ✅ Phải là `https://` (không phải `http://`)
- ✅ Phải match với Railway backend domain

### Bước 3: Redeploy

1. Vào tab **Deployments**
2. Click **"..."** (3 dots) ở deployment mới nhất
3. Chọn **"Redeploy"**
4. Đợi build xong (1-2 phút)

## 🔍 Kiểm tra sau khi deploy

### Cách 1: Kiểm tra trong Console

1. Mở website trên Vercel
2. Mở **DevTools** (F12) → **Console**
3. Tìm log: `[apiConfig] Final API Base URL:`
4. Kiểm tra URL có đúng không:
   - ✅ Phải có `/api` ở cuối
   - ✅ Phải là `https://`

### Cách 2: Test API call

1. Mở **DevTools** → **Console**
2. Chạy lệnh:
   ```javascript
   console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
   ```
3. Kiểm tra giá trị có đúng không

### Cách 3: Kiểm tra Network tab

1. Mở **DevTools** → **Network** tab
2. Reload page
3. Tìm request đến `/vehicles/featured` hoặc `/vehicles`
4. Kiểm tra **Request URL**:
   - ✅ Phải có `/api` prefix: `https://logic-production-f1c1.up.railway.app/api/vehicles/featured`
   - ❌ Không được là: `https://logic-production-f1c1.up.railway.app/vehicles/featured`

## 🆘 Nếu vẫn còn lỗi 404

### Kiểm tra lại:

1. **VITE_API_URL đã set đúng chưa?**
   - Phải là: `https://logic-production-f1c1.up.railway.app/api`
   - Không được là: `https://logic-production-f1c1.up.railway.app` (thiếu `/api`)

2. **Đã redeploy chưa?**
   - Environment variables chỉ có hiệu lực sau khi redeploy
   - Phải redeploy sau khi thay đổi

3. **Backend có đang chạy không?**
   - Test: https://logic-production-f1c1.up.railway.app/docs
   - Nếu không mở được, backend đang down

4. **CORS có đúng không?**
   - Backend phải allow Vercel domain trong `CORS_ORIGINS`
   - Kiểm tra trong Railway: `CORS_ORIGINS=https://your-vercel-app.vercel.app`

## ✅ Checklist

- [ ] `VITE_API_URL` đã set trong Vercel
- [ ] `VITE_API_URL` có `/api` ở cuối
- [ ] `VITE_API_URL` dùng `https://` (không phải `http://`)
- [ ] Đã redeploy sau khi set environment variable
- [ ] Đã kiểm tra console log để xem URL có đúng không
- [ ] Đã kiểm tra Network tab để xem request URL có đúng không
- [ ] Backend đang chạy (test `/docs` endpoint)

## 📝 Lưu ý

- Code đã được update để tự động thêm `/api` nếu thiếu (safety check)
- Nhưng tốt nhất là set đúng `VITE_API_URL` ngay từ đầu
- Sau khi fix, tất cả API calls sẽ hoạt động bình thường

