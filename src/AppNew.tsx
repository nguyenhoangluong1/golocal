import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { I18nProvider } from './contexts/I18nContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

// Lazy load pages for better performance
const HomeTesla = lazy(() => import('./pages/HomeTesla'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const FacebookCallbackPage = lazy(() => import('./pages/FacebookCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const PlaceDetailPage = lazy(() => import('./pages/PlaceDetailPage'));
const HostYourVehiclePage = lazy(() => import('./pages/HostYourVehiclePage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const InsurancePage = lazy(() => import('./pages/InsurancePage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminVehiclesPage = lazy(() => import('./pages/AdminVehiclesPage'));
const AdminBookingsPage = lazy(() => import('./pages/AdminBookingsPage'));
const AdminKYCPage = lazy(() => import('./pages/AdminKYCPage'));
const AdminPayoutsPage = lazy(() => import('./pages/AdminPayoutsPage'));
const KYCUploadPage = lazy(() => import('./pages/KYCUploadPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingApprovalPage = lazy(() => import('./pages/BookingApprovalPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF]"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const CartPage = lazy(() => import('./pages/CartPage'));


// Removed PlacesPage and BecomeHostPage - now using real pages
// Documentation pages now using real components instead of placeholders

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth routes without layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                <Route path="/auth/facebook/callback" element={<FacebookCallbackPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Main routes with layout */}
                <Route element={<Layout />}>
                  <Route path="/" element={<HomeTesla />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/booking-approval" element={<BookingApprovalPage />} />
                  <Route path="/places" element={<DestinationsPage />} />
                  <Route path="/destinations" element={<DestinationsPage />} />
                  <Route path="/place/:id" element={<PlaceDetailPage />} />
                  <Route path="/become-owner" element={<HostYourVehiclePage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route path="/insurance" element={<InsurancePage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
                  <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                  <Route path="/admin/kyc" element={<AdminKYCPage />} />
                  <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
                  
                  {/* KYC routes */}
                  <Route path="/kyc" element={<KYCUploadPage />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
