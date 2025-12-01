# GoLocal Frontend 🚗

React + TypeScript + Vite frontend cho ứng dụng GoLocal - nền tảng cho thuê xe và khám phá địa điểm du lịch.

## 🎯 Tính năng

- ✅ **Tìm kiếm xe thuê**: Tìm kiếm và lọc xe theo thành phố, loại xe, giá cả
- ✅ **Địa điểm du lịch**: Khám phá các địa điểm nổi tiếng với bản đồ tương tác
- ✅ **Đặt xe**: Hệ thống đặt xe với validation và thanh toán
- ✅ **AI Chatbot**: Trợ lý AI thông minh với Google Gemini
- ✅ **Quản lý tài khoản**: Profile, bookings, vehicles của bạn
- ✅ **Admin Dashboard**: Quản lý users, vehicles, bookings (cho admin)
- ✅ **Responsive Design**: Tối ưu cho mobile và desktop
- ✅ **Dark Mode**: Hỗ trợ dark/light theme

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 3
- **Maps**: Leaflet + React Leaflet
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Authentication**: Supabase Auth
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/nguyenhoangluong1/golocal.git
cd golocal

# Install dependencies
npm install
```

## ⚙️ Configuration

1. Tạo file `.env.local` trong thư mục `frontend/`:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Backend
VITE_API_URL=http://localhost:5000/api

# Google OAuth (nếu sử dụng)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Facebook OAuth (nếu sử dụng)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

2. Cập nhật `VITE_API_URL` cho production:
```env
VITE_API_URL=https://your-backend-api.com/api
```

## 🚀 Running

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── layout/         # Layout components
│   │   ├── forms/          # Form components
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── HomeTesla.tsx
│   │   ├── SearchPage.tsx
│   │   ├── VehicleDetailPage.tsx
│   │   └── ...
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   │   ├── api.ts         # API client
│   │   └── helpers.ts
│   ├── lib/                # Third-party library configs
│   │   └── supabase.ts
│   ├── types/              # TypeScript type definitions
│   ├── assets/             # Static assets (images, etc.)
│   ├── AppNew.tsx          # Main App component
│   └── main.tsx            # Entry point
├── public/                 # Public assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔗 API Integration

Frontend kết nối với backend API tại `VITE_API_URL`. Các endpoints chính:

- **Vehicles**: `/api/vehicles`
- **Places**: `/api/places`
- **Bookings**: `/api/bookings`
- **Auth**: `/api/auth/*`
- **Chatbot**: `/api/chatbot`
- **Admin**: `/api/admin/*`

Xem chi tiết trong `src/utils/api.ts`

## 🎨 Styling

Project sử dụng **Tailwind CSS** với custom configuration:

- Responsive breakpoints
- Dark mode support
- Custom color palette
- Custom animations

## 🔐 Authentication

Frontend sử dụng Supabase Auth với các providers:

- Email/Password
- Google OAuth
- Facebook OAuth

Xem `src/contexts/AuthContext.tsx` để biết chi tiết.

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly UI components

## 🧪 Development

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Build analysis
npm run build -- --analyze
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

### Environment Variables

Đảm bảo set các biến môi trường trong hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (production backend URL)

## 📝 Notes

- Sử dụng **React 19** với latest features
- **Vite** cho fast HMR và build
- **TypeScript** strict mode enabled
- **ESLint** cho code quality
- **Tailwind CSS** cho styling

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License

---

Made with ❤️ by GoLocal Team
