import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Star, Shield, Users, Calendar, 
  ChevronLeft, ChevronRight, Heart, Share2,
  Check, Fuel, Gauge, Car, Settings, MessageSquare, AlertCircle, X
} from 'lucide-react';
import { VEHICLE_TYPES } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { bookingsAPI, paymentsAPI, messagesAPI } from '../utils/api';
import { useFavorites } from '../hooks/useFavorites';
import axios from 'axios';

import { getApiBaseUrl, ensureHttps } from '../utils/apiConfig';
// CRITICAL: Normalize URL to ensure HTTPS
let API_URL = getApiBaseUrl();
API_URL = ensureHttps(API_URL);

interface Vehicle {
  id: string;
  name: string;
  type: string;
  brand: string;
  price_per_day: number;
  city: string;
  address: string;
  images: string[];
  rating: number;
  total_trips: number;
  available: boolean;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
  features: string[];
  description: string;
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showError, showWarning, showSuccess } = useToast();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showKYCModal, setShowKYCModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadVehicle();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Load dates from URL search params if available (from search page)
  // Only set once when component mounts or when search params change
  useEffect(() => {
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    if (startParam) {
      setStartDate(startParam);
    }
    if (endParam) {
      setEndDate(endParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadVehicle = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vehicles/${id}`);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      // Error loading vehicle - will show error state in UI
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (vehicle) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
    }
  };

  const prevImage = () => {
    if (vehicle) {
      setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateTotal = () => {
    if (!vehicle) return 0;
    const days = calculateDays();
    return days * vehicle.price_per_day;
  };

  const handleContactHost = async () => {
    // Check authentication
    if (!isAuthenticated || !user) {
      showWarning('Please login to contact the host');
      navigate('/login');
      return;
    }

    if (!vehicle || !vehicle.owner?.id) {
      showError('Host information not available');
      return;
    }

    // Check if user is trying to contact themselves
    if (user.id === vehicle.owner.id) {
      showWarning('You cannot contact yourself');
      return;
    }

    try {
      // Try to find existing conversation with this host
      const conversations = await messagesAPI.getConversations();
      const existingConv = conversations.data?.find((conv: any) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        return otherUserId === vehicle.owner.id;
      });

      if (existingConv) {
        // Navigate to existing conversation
        navigate(`/messages?conversation=${existingConv.id}`);
      } else {
        // Navigate to messages page with host_id - conversation will be created when first message is sent
        navigate(`/messages?host_id=${vehicle.owner.id}&vehicle_id=${vehicle.id}`);
      }
    } catch (error: any) {
      console.error('Error finding conversation:', error);
      // Fallback: navigate to messages page anyway
      navigate(`/messages?host_id=${vehicle.owner.id}&vehicle_id=${vehicle.id}`);
    }
  };

  const handleBooking = async () => {
    // Check authentication
    if (!isAuthenticated || !user) {
      showWarning('Please login to book a vehicle');
      navigate('/login');
      return;
    }

    // Check KYC verification
    if (!user.kyc_status || user.kyc_status.toUpperCase() !== 'VERIFIED') {
      setShowKYCModal(true);
      return;
    }

    // Validate dates
    if (!startDate || !endDate) {
      showWarning('Please select start and end dates');
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      showWarning('End date must be after start date');
      return;
    }

    try {
      setBookingLoading(true);

      // Calculate total price (service fee will be deducted from host payout)
      const totalPrice = calculateTotal();

      // Step 1: Create booking
      const bookingResponse = await bookingsAPI.create({
        vehicle_id: id,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        total_price: totalPrice,
        notes: '',
        pickup_location: vehicle?.address,
        return_location: vehicle?.address,
      });

      const booking = bookingResponse.data;

      // Step 2: Create payment intent
      const paymentResponse = await paymentsAPI.createIntent({
        booking_id: booking.id,
        amount: totalPrice,
        currency: 'vnd',
      });

      // Step 3: Redirect to payment page with payment intent
      navigate('/payment', {
        state: {
          paymentIntentId: paymentResponse.data.payment_intent_id,
          clientSecret: paymentResponse.data.client_secret,
          bookingId: booking.id,
          amount: totalPrice,
          vehicleName: vehicle?.name,
        },
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.detail || 'An error occurred while booking. Please try again.';
      showError(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Vehicle ID</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The vehicle ID is missing or invalid.</p>
          <button 
            onClick={() => navigate('/search')} 
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vehicle not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The vehicle you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Image Gallery */}
      <div className="relative h-[70vh] bg-black">
        <img
          src={vehicle.images[currentImageIndex]}
          alt={vehicle.name}
          className="w-full h-full object-cover"
          loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={currentImageIndex === 0 ? 'high' : 'low'}
        />
        
        {/* Navigation Arrows */}
        {vehicle.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {vehicle.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!isAuthenticated) {
                  showWarning('Please login to save favorites');
                  navigate('/login');
                  return;
                }
                if (id) {
                  const success = await toggleFavorite(id, 'vehicle');
                  if (success) {
                    showSuccess(isFavorited(id) ? 'Removed from favorites' : 'Added to favorites');
                  }
                }
              }}
              className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <Heart className={`w-6 h-6 ${id && isFavorited(id) ? 'fill-rose-600 text-rose-600' : 'text-gray-900 dark:text-white'}`} />
            </button>
            <button className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Share2 className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Left Column - Details */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-sm font-medium">
                    {VEHICLE_TYPES.find(t => t.value === vehicle.type)?.label || vehicle.type}
                </span>
                {vehicle.available && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    Available
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {vehicle.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">{vehicle.rating}</span>
                  <span>({vehicle.total_trips} trips)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{vehicle.city}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About this vehicle
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {vehicle.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Features
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {vehicle.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Specifications
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Brand</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{vehicle.brand}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{VEHICLE_TYPES.find(t => t.value === vehicle.type)?.label || vehicle.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Fuel className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fuel</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Gasoline</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Gauge className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Max Speed</p>
                    <p className="font-semibold text-gray-900 dark:text-white">100 km/h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Vehicle Owner
              </h2>
              <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                  {vehicle.owner.avatar ? (
                    <img src={vehicle.owner.avatar} alt={vehicle.owner.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    vehicle.owner.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {vehicle.owner.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>{vehicle.owner.rating} rating</span>
                  </div>
                </div>
                <button
                  onClick={handleContactHost}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 space-y-6">
              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₫{vehicle.price_per_day.toLocaleString()}
                  <span className="text-base font-normal text-gray-600 dark:text-gray-400">/day</span>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              {calculateDays() > 0 && (
                <div className="py-4 border-t border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₫{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={!startDate || !endDate || !vehicle.available || bookingLoading}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : vehicle.available ? (
                  'Book Now'
                ) : (
                  'Not Available'
                )}
              </button>

              {/* Trust Badges */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Protected by GoLocal Insurance</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>24/7 Customer Support</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Free cancellation up to 24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Requirement Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  KYC Verification Required
                </h2>
              </div>
              <button
                onClick={() => setShowKYCModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To rent a vehicle, you need to complete KYC (Know Your Customer) verification first. This helps us ensure a safe and secure rental experience for everyone.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">
                  What you'll need:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Valid ID card, driver's license, or passport</li>
                  <li>Front and back photos of your document</li>
                  <li>Optional: Selfie photo for verification</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The verification process usually takes 1-2 business days. You'll receive a notification once your KYC is approved.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowKYCModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKYCModal(false);
                  navigate('/kyc');
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Verify Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
