# 🔧 Fix ERR_TOO_MANY_REDIRECTS - Browser Cache Issue

## ✅ Backend đã hoạt động tốt!

Từ kết quả test với curl:
- ✅ GET requests hoạt động (200 OK)
- ✅ Proxy headers đúng (`x-forwarded-proto: https`)
- ✅ Backend không có redirect logic

**Vấn đề là ở browser cache hoặc CORS preflight!**

## 🔍 Nguyên nhân

Browser có thể đã cache:
- Redirect responses cũ (301/302)
- CORS preflight responses
- Service Worker cache

## 🚀 Giải pháp

### Bước 1: Clear Browser Cache

#### Chrome/Edge:
1. Mở DevTools (F12)
2. Right-click vào nút **Refresh** (reload)
3. Chọn **"Empty Cache and Hard Reload"**
4. Hoặc:
   - Ctrl+Shift+Delete
   - Chọn "Cached images and files"
   - Time range: "All time"
   - Click "Clear data"

#### Firefox:
1. Ctrl+Shift+Delete
2. Chọn "Cache"
3. Time range: "Everything"
4. Click "Clear Now"

### Bước 2: Disable Service Worker (nếu có)

1. Mở DevTools (F12)
2. Vào tab **Application** (Chrome) hoặc **Storage** (Firefox)
3. Tìm **Service Workers**
4. Click **Unregister** cho tất cả service workers
5. Refresh page

### Bước 3: Test với Incognito/Private Window

1. Mở Incognito/Private window (Ctrl+Shift+N)
2. Truy cập website
3. Xem còn lỗi không

### Bước 4: Clear Network Cache trong DevTools

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Right-click vào bất kỳ request nào
4. Chọn **"Clear browser cache"**
5. Hoặc check **"Disable cache"** (chỉ khi DevTools mở)

### Bước 5: Kiểm tra CORS Preflight

Nếu vẫn còn lỗi, kiểm tra CORS preflight:

1. Mở DevTools → Network tab
2. Tìm request bị lỗi
3. Xem có OPTIONS request trước GET không
4. Kiểm tra response headers của OPTIONS request

## 🔍 Debug trong Browser

### Kiểm tra Request Headers

Trong DevTools → Network:
1. Click vào request bị lỗi
2. Xem tab **Headers**
3. Kiểm tra:
   - **Request URL**: Có đúng HTTPS không?
   - **Request Method**: GET hay OPTIONS?
   - **Status Code**: 301/302/307/308 (redirect) hay 200?

### Kiểm tra Response Headers

1. Click vào request bị lỗi
2. Xem tab **Headers** → **Response Headers**
3. Tìm:
   - `Location:` header (có nghĩa là redirect)
   - `Access-Control-Allow-Origin:` (CORS)

## 🆘 Nếu vẫn còn lỗi sau khi clear cache

### Kiểm tra VITE_API_URL

1. Mở DevTools → Console
2. Gõ: `import.meta.env.VITE_API_URL`
3. Kiểm tra URL có đúng không:
   - ✅ Phải là: `https://logic-production-f1c1.up.railway.app/api`
   - ❌ Không được là: `http://...` (HTTP)

### Kiểm tra API Base URL

1. Mở DevTools → Console
2. Tìm log: `[api] API_BASE_URL:`
3. Kiểm tra URL có đúng HTTPS không

### Test trực tiếp trong Console

```javascript
// Test API call trực tiếp
fetch('https://logic-production-f1c1.up.railway.app/api/vehicles/featured?limit=3')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Nếu test này hoạt động → Vấn đề là ở axios config
Nếu test này cũng lỗi → Vấn đề là ở browser/network

## ✅ Checklist

- [ ] Đã clear browser cache
- [ ] Đã unregister service workers
- [ ] Đã test với Incognito window
- [ ] Đã check VITE_API_URL trong console
- [ ] Đã test fetch() trực tiếp trong console
- [ ] Đã check Network tab trong DevTools

## 📝 Lưu ý

- **Backend đã hoạt động tốt** - không cần thay đổi gì ở backend
- **Vấn đề là ở browser cache** - clear cache sẽ fix
- **CORS preflight** có thể gây redirect loop nếu browser cache sai

