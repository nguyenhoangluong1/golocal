import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Car, Calendar, Settings, MapPin, Star, Phone, Mail, Edit2, Save, X, MessageSquare, Wallet, CheckCircle, Heart, CreditCard, Building2, ArrowDownCircle, Trash2 } from 'lucide-react';
import AvatarUpload from '../components/common/AvatarUpload';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertDialog from '../components/common/AlertDialog';
import { useDialog } from '../hooks/useDialog';
import axios from 'axios';
import { vehiclesAPI, reviewsAPI } from '../utils/api';
import { bookingsAPI, paymentsAPI, favoritesAPI } from '../utils/api';
import { useFavorites } from '../hooks/useFavorites';

import { getApiBaseUrl, ensureHttps } from '../utils/apiConfig';
// CRITICAL: Normalize URL to ensure HTTPS
let API_URL = getApiBaseUrl();
API_URL = ensureHttps(API_URL);

interface Booking {
  id: string;
  vehicle_name?: string;
  vehicle?: {
    id: string;
    name: string;
    images?: string[];
  };
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  user_role?: 'customer' | 'host';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  price_per_day: number;
  city: string;
  available: boolean;
  image?: string;
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { showConfirm, showAlert, DialogComponents } = useDialog();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showBankInfoModal, setShowBankInfoModal] = useState(false);
  const [showPayoutRequestModal, setShowPayoutRequestModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutMethod, setPayoutMethod] = useState<'BANK_TRANSFER' | 'STRIPE_CONNECT'>('BANK_TRANSFER');
  const [deleteVehicleDialog, setDeleteVehicleDialog] = useState<{
    isOpen: boolean;
    vehicleId: string;
    vehicleName: string;
  } | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: user?.bank_name || '',
    accountNumber: user?.account_number || '',
    accountHolder: user?.account_holder || '',
  });
  const { refreshFavorites } = useFavorites();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });

  // Use ref to track if we've initialized form data to prevent unnecessary updates
  const formDataInitialized = useRef(false);
  const bankInfoInitialized = useRef(false);

  // Memoize loadUserData to prevent recreation on every render
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Load bookings (both as customer and host) and vehicles
      // Use Promise.allSettled to handle partial failures gracefully
      // OPTIMIZATION: Use request deduplication to prevent duplicate calls
      const [bookingsResult, vehiclesResult] = await Promise.allSettled([
        bookingsAPI.getMyBookings(), // Already cached and deduplicated via api interceptor
        vehiclesAPI.getAll({ owner_id: user.id }) // Already cached and deduplicated via api interceptor
      ]);
      
      // Handle bookings
      if (bookingsResult.status === 'fulfilled') {
        // Backend returns { bookings: [...], total: ..., page: ..., limit: ..., pages: ... }
        const responseData = bookingsResult.value.data || {};
        const bookingsArray = Array.isArray(responseData) 
          ? responseData 
          : (responseData.bookings || []);
        
        const bookingsData = bookingsArray.map((booking: any) => ({
          id: booking.id,
          vehicle_name: booking.vehicle?.name || booking.vehicle_name,
          vehicle: booking.vehicle,
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_price: booking.total_price,
          status: booking.status,
          user_role: booking.user_role || 'customer',
          user: booking.user,
        }));
        setBookings(bookingsData);
      } else {
        console.error('Failed to load bookings:', bookingsResult.reason);
        setBookings([]); // Set empty array on error
      }
      
      // Handle vehicles
      if (vehiclesResult.status === 'fulfilled') {
        // ALGORITHM: Backend now returns paginated response
        // Response format: { vehicles: [...], total: number, page: number, limit: number, pages: number }
        const vehiclesData = vehiclesResult.value.data?.vehicles || vehiclesResult.value.data || [];
        setMyVehicles(vehiclesData);
      } else {
        console.error('Failed to load vehicles:', vehiclesResult.reason);
        setMyVehicles([]); // Set empty array on error
      }
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      // Set empty arrays to prevent UI breaking
      setBookings([]);
      setMyVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Memoize loadPayouts
  const loadPayouts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setPayoutsLoading(true);
      const response = await paymentsAPI.getMyPayouts();
      // Backend now returns empty array on error, so this is safe
      setPayouts(response.data?.payouts || []);
    } catch (error: any) {
      console.error('Failed to load payouts:', error);
      // Set empty array to prevent UI breaking
      setPayouts([]);
      // Only show error if it's not a timeout (timeout is handled by backend returning empty)
      if (error.code !== 'ECONNABORTED' && error.response?.status !== 500) {
        // Silent fail for expected errors
      }
    } finally {
      setPayoutsLoading(false);
    }
  }, [user?.id]);

  // Memoize loadFavorites
  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;
    try {
      setFavoritesLoading(true);
      const response = await favoritesAPI.getAll();
      // Backend now returns empty array on error, so this is safe
      setFavorites(response.data?.favorites || []);
    } catch (error: any) {
      console.error('Failed to load favorites:', error);
      // Set empty array to prevent UI breaking
      setFavorites([]);
      // Only show error if it's not a timeout (timeout is handled by backend returning empty)
      if (error.code !== 'ECONNABORTED' && error.response?.status !== 500) {
        // Silent fail for expected errors
      }
    } finally {
      setFavoritesLoading(false);
    }
  }, [user?.id]);

  // Initialize form data and bank info only when user data actually changes
  useEffect(() => {
    if (!user) {
      formDataInitialized.current = false;
      bankInfoInitialized.current = false;
      return;
    }

    // Only update if values actually changed (compare with current state)
    const newFormData = {
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || ''
    };

    const newBankInfo = {
      bankName: user.bank_name || '',
      accountNumber: user.account_number || '',
      accountHolder: user.account_holder || '',
    };

    // Check if form data changed by comparing with current state
    setFormData(prev => {
      if (!formDataInitialized.current || 
          prev.name !== newFormData.name ||
          prev.phone !== newFormData.phone ||
          prev.bio !== newFormData.bio ||
          prev.location !== newFormData.location) {
        formDataInitialized.current = true;
        return newFormData;
      }
      return prev;
    });

    // Check if bank info changed by comparing with current state
    setBankInfo(prev => {
      if (!bankInfoInitialized.current ||
          prev.bankName !== newBankInfo.bankName ||
          prev.accountNumber !== newBankInfo.accountNumber ||
          prev.accountHolder !== newBankInfo.accountHolder) {
        bankInfoInitialized.current = true;
        return newBankInfo;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.name, user?.phone, user?.bio, user?.location, user?.bank_name, user?.account_number, user?.account_holder]);

  // Load user data when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id, loadUserData]);

  // Refresh user data periodically to check for KYC status updates
  // OPTIMIZE: Only refresh when page is visible and user is on KYC tab
  useEffect(() => {
    if (!user?.id) return;

    const refreshUserData = () => {
      // Only refresh if page is visible
      if (document.hidden) return;
      
      // Only refresh if user is on KYC tab or profile tab (where KYC status matters)
      if (activeTab === 'kyc' || activeTab === 'profile') {
        refreshUser();
      }
    };

    // Refresh immediately on mount if on relevant tab
    if (activeTab === 'kyc' || activeTab === 'profile') {
      refreshUser();
    }

    // Set up interval to refresh every 30 seconds, but only when page is visible and on relevant tab
    const interval = setInterval(refreshUserData, 30000); // 30 seconds
    
    // Also reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && (activeTab === 'kyc' || activeTab === 'profile')) {
        refreshUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeTab]); // Depend on activeTab to refresh when switching tabs

  // Load tab-specific data
  useEffect(() => {
    if (!user?.id) return;
    
    if (activeTab === 'payouts') {
      loadPayouts();
    } else if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [user?.id, activeTab, loadPayouts, loadFavorites]);

  const handleRemoveFavorite = async (favorite: any) => {
    try {
      if (favorite.vehicle_id) {
        await favoritesAPI.removeVehicle(favorite.vehicle_id);
      } else if (favorite.place_id) {
        await favoritesAPI.removePlace(favorite.place_id);
      }
      await loadFavorites();
      await refreshFavorites();
    } catch (error: any) {
      console.error('Failed to remove favorite:', error);
      showAlert('Error', 'Failed to remove favorite', 'error');
    }
  };

  const handleDeleteVehicleClick = (vehicleId: string, vehicleName: string) => {
    setDeleteVehicleDialog({
      isOpen: true,
      vehicleId,
      vehicleName,
    });
  };

  const handleDeleteVehicleConfirm = async () => {
    if (!deleteVehicleDialog) return;
    
    setIsDeletingVehicle(true);
    try {
      console.log('🗑️ Deleting vehicle:', deleteVehicleDialog.vehicleId);
      const response = await vehiclesAPI.delete(deleteVehicleDialog.vehicleId);
      console.log('✅ Delete response:', response);
      
      setDeleteVehicleDialog(null);
      
      // Reload vehicles
      if (user?.id) {
        console.log('🔄 Reloading vehicles for user:', user.id);
        const vehiclesResult = await vehiclesAPI.getAll({ owner_id: user.id });
        const vehiclesData = vehiclesResult.data?.vehicles || vehiclesResult.data || [];
        console.log('📋 Reloaded vehicles:', vehiclesData.length);
        setMyVehicles(vehiclesData);
      }
      
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Vehicle deleted successfully',
        type: 'success',
      });
    } catch (error: any) {
      console.error('❌ Failed to delete vehicle:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      setDeleteVehicleDialog(null);
      
      // Better error messages
      let errorMessage = 'Failed to delete vehicle';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this vehicle';
      } else if (error.response?.status === 404) {
        errorMessage = 'Vehicle not found';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 'Cannot delete vehicle with active bookings';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const handleSubmitReview = async (_bookingId: string, vehicleId: string) => {
    if (!user?.id || !reviewRating) return;
    
    try {
      setSubmittingReview(true);
      await reviewsAPI.create({
        user_id: user.id,
        vehicle_id: vehicleId,
        rating: reviewRating,
        comment: reviewComment || undefined,
        target_type: 'vehicle',
      });
      
      // Reset form
      setReviewingBooking(null);
      setReviewRating(5);
      setReviewComment('');
      
      // Reload bookings to refresh review status
      await loadUserData();
      
      showAlert('Success', 'Review submitted successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      showAlert('Error', error.message || 'Failed to submit review. Please try again.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAvatarUpload = async (avatarData: string) => {
    const token = localStorage.getItem('access_token'); // ✅ Fixed: was 'token'
    await axios.put(
      `${API_URL.replace('/api', '')}/auth/profile`,
      { avatar: avatarData },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Refresh user data without reloading page
    await refreshUser();
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('access_token'); // ✅ Fixed: was 'token'
      
      // Only send non-empty fields
      const updateData: any = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.bio) updateData.bio = formData.bio;
      if (formData.location) updateData.location = formData.location;
      
      await axios.put(
        `${API_URL.replace('/api', '')}/auth/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      // Refresh user data without reloading page
      await refreshUser();
      showAlert('Success', 'Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showAlert('Error', error.response?.data?.detail || 'Failed to update profile. Please check your input.', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: 'My Trips', icon: Calendar },
    { id: 'vehicles', label: 'My Vehicles', icon: Car },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'payouts', label: 'Payouts', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view your profile
          </h2>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors pt-20 pb-12">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20">
        {/* Profile Header - New Layout */}
        <div className="mb-8">
          {/* Main Profile Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Left: Avatar Section */}
              <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                <div className="relative mb-6">
                  {/* Avatar Container with improved styling */}
                  <div className="relative">
                    <AvatarUpload
                      currentAvatar={user.avatar}
                      userName={user.name}
                      onUpload={handleAvatarUpload}
                    />
                    
                    {/* KYC Status Badge - Floating */}
                    <div className="absolute -top-2 -left-2 z-20">
                      {user.kyc_status?.toUpperCase() === 'VERIFIED' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full border-2 border-white dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-bold">Verified</span>
                        </div>
                      ) : user.kyc_status?.toUpperCase() === 'PENDING' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-xs font-bold">Pending</span>
                        </div>
                      ) : (
                        <a
                          href="/kyc"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-full border-2 border-white dark:border-gray-800 shadow-lg hover:bg-rose-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs font-bold">Verify</span>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Role Badge - Improved styling */}
                  <div className="mt-4 inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">
                    <User className="w-4 h-4 mr-2" />
                    {user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Owner' : 'Traveler'}
                  </div>
                </div>
              </div>

              {/* Center: User Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {user.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-2xl border-2 border-yellow-200/50 dark:border-yellow-800/50 shadow-lg hover:shadow-xl transition-all">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                      <Star className="w-7 h-7 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {user.rating?.toFixed(1) || '5.0'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">Rating</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                      <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {user.total_trips || 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">Trips</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-2xl border-2 border-green-200/50 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-all">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                      <MapPin className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formData.location || 'Vietnam'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">Location</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8">
          <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-800/30">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 whitespace-nowrap transition-all relative ${
                      activeTab === tab.id
                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-800'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      EDIT PROFILE
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-12 py-4 text-sm font-medium tracking-widest border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-xl"
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        CANCEL
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        SAVE CHANGES
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all"
                          placeholder="+84 123 456 789"
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.phone || 'Not provided'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Location
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all"
                          placeholder="Ho Chi Minh City, Vietnam"
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {formData.location || 'Ho Chi Minh City'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      About Me
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all resize-none"
                      placeholder="Tell us about yourself, your travel preferences, interests..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  My Trips & Bookings
                </h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trips and bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No trips or bookings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Start your adventure by booking a vehicle or list your vehicle to receive bookings
                    </p>
                    <div className="flex gap-4 justify-center">
                      <a
                        href="/search"
                        className="inline-flex items-center gap-2 px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
                      >
                        <Car className="w-5 h-5" />
                        BROWSE VEHICLES
                      </a>
                      <a
                        href="/become-owner"
                        className="inline-flex items-center gap-2 px-12 py-4 text-sm font-medium tracking-widest border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all rounded-xl"
                      >
                        LIST YOUR VEHICLE
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(booking => {
                      const isHost = booking.user_role === 'host';
                      const vehicleName = booking.vehicle_name || booking.vehicle?.name || 'Unknown Vehicle';
                      
                      return (
                        <div key={booking.id} className="border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xl transition-all shadow-lg">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                  {vehicleName}
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  isHost 
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}>
                                  {isHost ? 'Host' : 'Customer'}
                                </span>
                              </div>
                              {isHost && booking.user && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <span className="font-medium">Guest:</span> {booking.user.name}
                                </div>
                              )}
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(booking.start_date).toLocaleDateString('en-US')} - {new Date(booking.end_date).toLocaleDateString('en-US')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  booking.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                  booking.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                  booking.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <button
                                  onClick={() => navigate(`/messages?booking=${booking.id}`)}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Message
                                </button>
                                {isHost && booking.status === 'PENDING' && (
                                  <button
                                    onClick={() => navigate('/booking-approval')}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                                  >
                                    Review
                                  </button>
                                )}
                                {!isHost && booking.status === 'COMPLETED' && booking.vehicle?.id && (
                                  <button
                                    onClick={() => setReviewingBooking(booking.id)}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
                                  >
                                    <Star className="w-4 h-4" />
                                    Rate Vehicle
                                  </button>
                                )}
                              </div>
                              {/* Review Form Modal */}
                              {reviewingBooking === booking.id && booking.vehicle?.id && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Rate Your Experience</h4>
                                  <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Rating (1-5 stars)
                                    </label>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setReviewRating(star)}
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`w-8 h-8 ${
                                              star <= reviewRating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Comment (optional)
                                    </label>
                                    <textarea
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                      rows={3}
                                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 dark:focus:ring-yellow-900/50 outline-none transition-all resize-none"
                                      placeholder="Share your experience..."
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSubmitReview(booking.id, booking.vehicle!.id)}
                                      disabled={submittingReview || !reviewRating}
                                      className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingBooking(null);
                                        setReviewRating(5);
                                        setReviewComment('');
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {booking.total_price.toLocaleString('vi-VN')} ₫
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {isHost ? 'Total Amount' : 'Total Price'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  My Vehicles
                </h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vehicles...</p>
                  </div>
                ) : myVehicles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Car className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No vehicles listed
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Start earning by listing your vehicle and connect with travelers
                    </p>
                    <a
                      href="/become-owner"
                      className="inline-flex items-center gap-2 px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
                    >
                      <Car className="w-5 h-5" />
                      LIST YOUR VEHICLE
                    </a>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {myVehicles.map(vehicle => (
                      <div key={vehicle.id} className="border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-green-300 dark:hover:border-green-700 hover:shadow-xl transition-all shadow-lg">
                        <div className="flex gap-4">
                          {vehicle.image && (
                            <img 
                              src={vehicle.image} 
                              alt={vehicle.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {vehicle.name}
                              </h3>
                              <button
                                onClick={() => handleDeleteVehicleClick(vehicle.id, vehicle.name)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                                  {vehicle.type}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  vehicle.available 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {vehicle.available ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {vehicle.price_per_day.toLocaleString('vi-VN')} ₫/day
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {vehicle.city}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  My Favorites
                </h2>
                {favoritesLoading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading favorites...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Start exploring and save your favorite vehicles and places for easy access later.
                    </p>
                    <a
                      href="/search"
                      className="inline-flex items-center gap-2 px-12 py-4 text-sm font-medium tracking-widest text-white bg-rose-600 hover:bg-rose-700 transition-all rounded-xl shadow-lg hover:shadow-2xl"
                    >
                      <Car className="w-5 h-5" />
                      EXPLORE VEHICLES
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Vehicles Section */}
                    {favorites.some((f: any) => f.vehicle_id) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Car className="w-5 h-5" />
                          Vehicles ({favorites.filter((f: any) => f.vehicle_id).length})
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favorites
                            .filter((f: any) => f.vehicle_id && f.vehicle)
                            .map((favorite: any) => {
                              const vehicle = favorite.vehicle;
                              return (
                                <div
                                  key={favorite.id}
                                  className="border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xl transition-all shadow-lg cursor-pointer"
                                  onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                                >
                                  {vehicle.images && vehicle.images[0] && (
                                    <img
                                      src={vehicle.images[0]}
                                      alt={vehicle.name}
                                      className="w-full h-48 object-cover"
                                    />
                                  )}
                                  <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                          {vehicle.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {vehicle.type} • {vehicle.city}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFavorite(favorite);
                                        }}
                                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        title="Remove from favorites"
                                      >
                                        <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        ₫{vehicle.price_per_day?.toLocaleString('vi-VN')}/day
                                      </div>
                                      {vehicle.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {vehicle.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Places Section */}
                    {favorites.some((f: any) => f.place_id) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Places ({favorites.filter((f: any) => f.place_id).length})
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favorites
                            .filter((f: any) => f.place_id && f.place)
                            .map((favorite: any) => {
                              const place = favorite.place;
                              return (
                                <div
                                  key={favorite.id}
                                  className="border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xl transition-all shadow-lg cursor-pointer"
                                  onClick={() => navigate(`/place/${place.id}`)}
                                >
                                  {place.photos && place.photos[0] && (
                                    <img
                                      src={place.photos[0]}
                                      alt={place.name}
                                      className="w-full h-48 object-cover"
                                    />
                                  )}
                                  <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                          {place.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {place.category} • {place.city}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFavorite(favorite);
                                        }}
                                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        title="Remove from favorites"
                                      >
                                        <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                                      </button>
                                    </div>
                                    {place.rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {place.rating.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Earnings & Payouts
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage your earnings and withdraw funds</p>
                  </div>
                  <button
                    onClick={() => setShowBankInfoModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] hover:from-[#5851EA] hover:to-[#7B73FF] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Bank Info
                  </button>
                </div>

                {payoutsLoading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF]"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payouts...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards - Stripe Style */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-50 dark:from-yellow-900/20 dark:via-yellow-800/10 dark:to-yellow-900/20 rounded-2xl p-6 border-2 border-yellow-200/50 dark:border-yellow-800/30 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 dark:bg-yellow-800/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-xl">
                              <Wallet className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
                            </div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pending</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            ₫{payouts
                              .filter(p => p.status === 'PENDING')
                              .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                              .toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Awaiting release
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 via-green-100/50 to-green-50 dark:from-green-900/20 dark:via-green-800/10 dark:to-green-900/20 rounded-2xl p-6 border-2 border-green-200/50 dark:border-green-800/30 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 dark:bg-green-800/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-green-500/20 dark:bg-green-500/30 rounded-xl">
                              <CheckCircle className="w-6 h-6 text-green-700 dark:text-green-400" />
                            </div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Released</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            ₫{payouts
                              .filter(p => p.status === 'RELEASED')
                              .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                              .toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Total received
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#635BFF]/10 via-[#8B80FF]/5 to-[#635BFF]/10 dark:from-[#635BFF]/20 dark:via-[#8B80FF]/10 dark:to-[#635BFF]/20 rounded-2xl p-6 border-2 border-[#635BFF]/20 dark:border-[#8B80FF]/30 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/10 dark:bg-[#8B80FF]/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-[#635BFF]/20 dark:bg-[#8B80FF]/30 rounded-xl">
                              <Star className="w-6 h-6 text-[#635BFF] dark:text-[#8B80FF]" />
                            </div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total</div>
                          </div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#635BFF] to-[#8B80FF] bg-clip-text text-transparent mb-1">
                            ₫{payouts
                              .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                              .toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            All-time earnings
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bank Account Info Card */}
                    {(user?.role === 'driver' || user?.role === 'admin') && (
                      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 border-2 border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-[#635BFF]/10 dark:bg-[#8B80FF]/20 rounded-xl">
                              <Building2 className="w-6 h-6 text-[#635BFF] dark:text-[#8B80FF]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">Bank Account</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Update your bank details for payouts</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowBankInfoModal(true)}
                            className="px-4 py-2 text-sm font-medium text-[#635BFF] dark:text-[#8B80FF] hover:bg-[#635BFF]/10 dark:hover:bg-[#8B80FF]/20 rounded-lg transition-colors"
                          >
                            {bankInfo.bankName ? 'Edit' : 'Add'}
                          </button>
                        </div>
                        {bankInfo.bankName ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                              <span className="text-gray-600 dark:text-gray-400">Bank Name</span>
                              <span className="font-medium text-gray-900 dark:text-white">{bankInfo.bankName}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                              <span className="text-gray-600 dark:text-gray-400">Account Number</span>
                              <span className="font-mono text-gray-900 dark:text-white">****{bankInfo.accountNumber.slice(-4)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-gray-600 dark:text-gray-400">Account Holder</span>
                              <span className="font-medium text-gray-900 dark:text-white">{bankInfo.accountHolder}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">No bank account added yet</p>
                            <button
                              onClick={() => setShowBankInfoModal(true)}
                              className="px-6 py-2 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] text-white rounded-lg font-medium hover:from-[#5851EA] hover:to-[#7B73FF] transition-all"
                            >
                              Add Bank Account
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payouts List */}
                    {payouts.length === 0 ? (
                      <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#635BFF]/10 to-[#8B80FF]/10 dark:from-[#635BFF]/20 dark:to-[#8B80FF]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Wallet className="w-10 h-10 text-[#635BFF] dark:text-[#8B80FF]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          No payouts yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          Your payouts will appear here once your vehicles receive bookings and payments are processed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#635BFF] rounded-full"></div>
                          Payout History
                        </h3>
                        {payouts.map((payout) => {
                          // const pendingAmount = payout.status === 'PENDING' ? parseFloat(payout.amount || 0) : 0;
                          return (
                            <div
                              key={payout.id}
                              className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-lg hover:shadow-xl transition-all"
                            >
                              {/* Status Header */}
                              <div className={`px-6 py-3 ${
                                payout.status === 'RELEASED'
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                  : payout.status === 'PENDING'
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                                  : 'bg-gradient-to-r from-red-500 to-rose-600'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span className="text-white font-semibold text-sm uppercase tracking-wide">
                                      {payout.status}
                                    </span>
                                  </div>
                                  {payout.status === 'PENDING' && (
                                    <button
                                      onClick={() => {
                                        // Check if bank info is set for manual transfer
                                        if (!bankInfo.bankName || !bankInfo.accountNumber) {
                                          showConfirm(
                                            'Bank Account Required',
                                            'You need to add bank account information first. Would you like to add it now?',
                                            () => {
                                              setShowBankInfoModal(true);
                                            },
                                            { confirmText: 'Yes, Add Bank Info', cancelText: 'Cancel' }
                                          );
                                          return;
                                        }
                                        setSelectedPayout(payout);
                                        setShowPayoutRequestModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                                    >
                                      <ArrowDownCircle className="w-3.5 h-3.5" />
                                      Request Payout
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {payout.payment?.booking?.vehicle?.name || 'Vehicle Rental'}
                                      </h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      {payout.payment?.booking && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                          <Calendar className="w-4 h-4" />
                                          <span>
                                            {new Date(payout.payment.booking.start_date).toLocaleDateString('vi-VN')} -{' '}
                                            {new Date(payout.payment.booking.end_date).toLocaleDateString('vi-VN')}
                                          </span>
                                        </div>
                                      )}
                                      {payout.scheduled_at && payout.status === 'PENDING' && (
                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                          <Calendar className="w-4 h-4" />
                                          <span>Scheduled: {new Date(payout.scheduled_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                      )}
                                      {payout.released_at && payout.status === 'RELEASED' && (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Released: {new Date(payout.released_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                      )}
                                      {payout.payment_method && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                          <CreditCard className="w-4 h-4" />
                                          <span>{payout.payment_method}</span>
                                        </div>
                                      )}
                                      {payout.transaction_reference && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                          <span className="font-mono text-xs">Ref: {payout.transaction_reference}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right border-l border-gray-200 dark:border-gray-700 pl-6">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-[#635BFF] to-[#8B80FF] bg-clip-text text-transparent mb-2">
                                      ₫{parseFloat(payout.amount || 0).toLocaleString('vi-VN')}
                                    </div>
                                    {payout.commission_amount && parseFloat(payout.commission_amount) > 0 && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Commission: ₫{parseFloat(payout.commission_amount).toLocaleString('vi-VN')}
                                      </div>
                                    )}
                                    {payout.total_amount && (
                                      <div className="text-xs text-gray-500 dark:text-gray-500">
                                        Total: ₫{parseFloat(payout.total_amount).toLocaleString('vi-VN')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Payout Request Modal */}
                {showPayoutRequestModal && selectedPayout && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#635BFF] to-[#8B80FF] px-6 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold text-lg">Request Payout</h3>
                          <button
                            onClick={() => {
                              setShowPayoutRequestModal(false);
                              setSelectedPayout(null);
                            }}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="bg-gradient-to-br from-[#635BFF]/10 to-[#8B80FF]/10 dark:from-[#635BFF]/20 dark:to-[#8B80FF]/20 rounded-xl p-4 border border-[#635BFF]/20">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payout Amount</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-[#635BFF] to-[#8B80FF] bg-clip-text text-transparent">
                            ₫{parseFloat(selectedPayout.amount || 0).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Payment Method
                          </label>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('BANK_TRANSFER')}
                              className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                                payoutMethod === 'BANK_TRANSFER'
                                  ? 'border-[#635BFF] bg-gradient-to-br from-[#635BFF]/10 to-[#8B80FF]/10'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${payoutMethod === 'BANK_TRANSFER' ? 'bg-[#635BFF]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                  <Building2 className={`w-5 h-5 ${payoutMethod === 'BANK_TRANSFER' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 dark:text-white">Bank Transfer</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    Manual transfer to your bank account (1-3 business days)
                                  </div>
                                </div>
                                {payoutMethod === 'BANK_TRANSFER' && (
                                  <CheckCircle className="w-5 h-5 text-[#635BFF]" />
                                )}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                showAlert('Coming Soon', 'Stripe Connect will be available soon. Please use Bank Transfer for now.', 'info');
                              }}
                              className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl opacity-50 cursor-not-allowed text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                                  <CreditCard className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-600 dark:text-gray-400">Stripe Connect</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    Automatic transfer via Stripe (Coming soon)
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">Soon</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {payoutMethod === 'BANK_TRANSFER' && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Bank Account Information
                            </div>
                            {bankInfo.bankName ? (
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{bankInfo.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Account:</span>
                                  <span className="font-mono text-gray-900 dark:text-white">****{bankInfo.accountNumber.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Holder:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{bankInfo.accountHolder}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                No bank account added. Please add your bank information first.
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setShowPayoutRequestModal(false);
                                setShowBankInfoModal(true);
                              }}
                              className="mt-3 text-sm text-[#635BFF] dark:text-[#8B80FF] hover:underline"
                            >
                              {bankInfo.bankName ? 'Update Bank Info' : 'Add Bank Info'}
                            </button>
                          </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                          <p className="text-xs text-blue-800 dark:text-blue-400">
                            <strong>Note:</strong> After you request payout, admin will process it within 1-3 business days. You'll receive a notification once it's completed.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={async () => {
                              if (payoutMethod === 'BANK_TRANSFER' && (!bankInfo.bankName || !bankInfo.accountNumber)) {
                                showAlert('Bank Account Required', 'Please add your bank account information first.', 'warning');
                                setShowPayoutRequestModal(false);
                                setShowBankInfoModal(true);
                                return;
                              }

                              showAlert(
                                'Payout Request Submitted',
                                `Amount: ₫${parseFloat(selectedPayout.amount || 0).toLocaleString('vi-VN')}\nMethod: ${payoutMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Stripe Connect'}\n\nAdmin will process it within 1-3 business days.`,
                                'success'
                              );
                              
                              setShowPayoutRequestModal(false);
                              setSelectedPayout(null);
                              await loadPayouts();
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] hover:from-[#5851EA] hover:to-[#7B73FF] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                          >
                            Submit Request
                          </button>
                          <button
                            onClick={() => {
                              setShowPayoutRequestModal(false);
                              setSelectedPayout(null);
                            }}
                            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Info Modal */}
                {showBankInfoModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                      {/* Stripe Header */}
                      <div className="bg-gradient-to-r from-[#635BFF] to-[#8B80FF] px-6 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold text-lg">Bank Account Information</h3>
                          <button
                            onClick={() => setShowBankInfoModal(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={bankInfo.bankName}
                            onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                            placeholder="e.g., Vietcombank, BIDV"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={bankInfo.accountNumber}
                            onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value.replace(/\D/g, '') })}
                            placeholder="1234567890"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 outline-none transition-all font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            value={bankInfo.accountHolder}
                            onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                            placeholder="NGUYEN VAN A"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 outline-none transition-all"
                          />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <p className="text-xs text-blue-800 dark:text-blue-400">
                            <strong>Note:</strong> This information is used for payouts. Make sure the account holder name matches your registered name.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('access_token');
                                if (!token) {
                                  showAlert('Authentication Required', 'Please login to save bank information', 'warning');
                                  return;
                                }

                                const updateData: any = {};
                                if (bankInfo.bankName) updateData.bank_name = bankInfo.bankName;
                                if (bankInfo.accountNumber) updateData.account_number = bankInfo.accountNumber;
                                if (bankInfo.accountHolder) updateData.account_holder = bankInfo.accountHolder;

                                await axios.put(
                                  `${API_URL.replace('/api', '')}/auth/profile`,
                                  updateData,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                
                                await refreshUser();
                                setShowBankInfoModal(false);
                                showAlert('Success', 'Bank information saved successfully!', 'success');
                              } catch (error: any) {
                                console.error('Failed to save bank info:', error);
                                showAlert('Error', error.response?.data?.detail || 'Failed to save bank information', 'error');
                              }
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] hover:from-[#5851EA] hover:to-[#7B73FF] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowBankInfoModal(false)}
                            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Settings & Preferences
                </h2>
                
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-5 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-rose-300 dark:hover:border-rose-700 transition-all bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive booking updates and reminders via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gray-900 dark:peer-checked:bg-gray-100"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-rose-300 dark:hover:border-rose-700 transition-all bg-white dark:bg-gray-800">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Push Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get real-time push notifications on your device</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gray-900 dark:peer-checked:bg-gray-100"></div>
                    </label>
                  </div>

                  {/* Marketing Emails */}
                  <div className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-rose-300 dark:hover:border-rose-700 transition-all bg-white dark:bg-gray-800">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Marketing Emails</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive special offers and travel inspiration</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gray-900 dark:peer-checked:bg-gray-100"></div>
                    </label>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Actions</h3>
                    <button
                      onClick={logout}
                      className="w-full px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      LOG OUT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Vehicle Confirmation Dialog */}
      {deleteVehicleDialog && (
        <ConfirmDialog
          isOpen={deleteVehicleDialog.isOpen}
          onClose={() => setDeleteVehicleDialog(null)}
          onConfirm={handleDeleteVehicleConfirm}
          title="Delete Vehicle"
          message={`Are you sure you want to delete "${deleteVehicleDialog.vehicleName}"? This will also delete all related bookings, reviews, and favorites. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={isDeletingVehicle}
        />
      )}

      {/* Alert Dialog */}
      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog(null)}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
        />
      )}

      {/* Dialog Components from useDialog hook */}
      <DialogComponents />
    </div>
  );
}
