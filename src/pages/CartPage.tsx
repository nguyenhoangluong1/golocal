import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';
import { vehiclesAPI, bookingsAPI, paymentsAPI } from '../utils/api';
import { 
  Calendar, MapPin, Car, Trash2, ArrowRight, Clock, 
  DollarSign, Shield, CheckCircle, Star
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface CartItem {
  vehicleId: string;
  startDate: string;
  endDate: string;
  vehicle?: {
    id: string;
    name: string;
    type: string;
    brand: string;
    price_per_day: number;
    city: string;
    address: string;
    images: string[];
    rating: number;
    owner: {
      name: string;
      avatar?: string;
    };
  };
}

const CART_STORAGE_KEY = 'golocal_cart';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showError, showWarning, showSuccess } = useToast();
  const { t } = useI18n();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      calculateTotals();
    }
  }, [cartItems]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) {
        setCartItems([]);
        return;
      }

      const items: CartItem[] = JSON.parse(stored);
      
      // Load vehicle details for each item
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await vehiclesAPI.getById(item.vehicleId);
            return {
              ...item,
              vehicle: response.data,
            };
          } catch (error) {
            console.error(`Failed to load vehicle ${item.vehicleId}:`, error);
            return item;
          }
        })
      );

      // Filter out items with invalid vehicles
      const validItems = itemsWithDetails.filter(item => item.vehicle);
      setCartItems(validItems);
      
      // Update localStorage with valid items only
      if (validItems.length !== items.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems.map(({ vehicle, ...rest }) => rest)));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      showError(t('cart.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    
    cartItems.forEach((item) => {
      if (item.vehicle && item.startDate && item.endDate) {
        const days = differenceInDays(parseISO(item.endDate), parseISO(item.startDate)) + 1;
        subtotal += item.vehicle.price_per_day * days;
      }
    });

    // Service fee: 10% of subtotal
    const fee = subtotal * 0.1;
    setServiceFee(fee);
    setTotalPrice(subtotal + fee);
  };

  const removeItem = (vehicleId: string) => {
    const updated = cartItems.filter(item => item.vehicleId !== vehicleId);
    setCartItems(updated);
    
    // Update localStorage
    const itemsToStore = updated.map(({ vehicle, ...rest }) => rest);
    if (itemsToStore.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemsToStore));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    
    showSuccess(t('cart.itemRemoved'));
  };

  const handleCheckout = async (item: CartItem) => {
    if (!isAuthenticated) {
      showWarning('Please login to continue');
      navigate('/login');
      return;
    }

    if (!item.vehicle) {
      showError(t('cart.vehicleInfoMissing'));
      return;
    }

    try {
      setProcessing(item.vehicleId);
      
      const days = differenceInDays(parseISO(item.endDate), parseISO(item.startDate)) + 1;
      const subtotal = item.vehicle.price_per_day * days;
      const fee = subtotal * 0.1;
      const total = subtotal + fee;

      // Step 1: Create booking
      const bookingResponse = await bookingsAPI.create({
        vehicle_id: item.vehicleId,
        start_date: new Date(item.startDate).toISOString(),
        end_date: new Date(item.endDate).toISOString(),
        total_price: total,
        notes: '',
        pickup_location: item.vehicle.address,
        return_location: item.vehicle.address,
      });

      const booking = bookingResponse.data;

      // Step 2: Create payment intent
      const paymentResponse = await paymentsAPI.createIntent({
        booking_id: booking.id,
        amount: total,
        currency: 'vnd',
      });

      // Step 3: Remove from cart
      removeItem(item.vehicleId);

      // Step 4: Redirect to payment page
      navigate('/payment', {
        state: {
          paymentIntentId: paymentResponse.data.payment_intent_id,
          clientSecret: paymentResponse.data.client_secret,
          bookingId: booking.id,
          amount: total,
          vehicleName: item.vehicle.name,
        },
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      showError(error.response?.data?.detail || 'Failed to process checkout. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckoutAll = async () => {
    if (!isAuthenticated) {
      showWarning('Please login to continue');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      showWarning(t('cart.empty'));
      return;
    }

    // Process first item (can be extended to handle multiple items)
    if (cartItems[0]) {
      await handleCheckout(cartItems[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('cart.loadingTripPlanner')}</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-20 md:py-32">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              {t('cart.empty')}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light mb-12 transition-colors">
              {t('cart.emptyDesc')}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2 mx-auto"
            >
              Browse Vehicles
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-20 md:py-32">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
            Trip Planner
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
            Finalize your itinerary, confirm pricing, and schedule pickup windows.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Left: Cart Items */}
          <div className="space-y-6">
            {cartItems.map((item) => {
              if (!item.vehicle) return null;
              
              const days = differenceInDays(parseISO(item.endDate), parseISO(item.startDate)) + 1;
              const itemSubtotal = item.vehicle.price_per_day * days;
              const itemFee = itemSubtotal * 0.1;
              const itemTotal = itemSubtotal + itemFee;

              return (
                <div
                  key={item.vehicleId}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  {/* Vehicle Info */}
                  <div className="flex gap-6 mb-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.vehicle.images?.[0] || '/placeholder-vehicle.jpg'}
                        alt={item.vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {item.vehicle.name}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {item.vehicle.brand} • {item.vehicle.type}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.vehicleId)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          disabled={processing === item.vehicleId}
                        >
                          <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{item.vehicle.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{item.vehicle.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pickup</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(parseISO(item.startDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Return</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(parseISO(item.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Duration</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {days} {days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Daily Rate</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₫{item.vehicle.price_per_day.toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('cart.subtotal')} ({days} {t('cart.days')})</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₫{itemSubtotal.toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('cart.serviceFee')}</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₫{itemFee.toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{t('cart.total')}</span>
                        <span className="text-gray-900 dark:text-white">
                          ₫{itemTotal.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => handleCheckout(item)}
                    disabled={processing === item.vehicleId}
                    className="w-full px-6 py-4 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing === item.vehicleId ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        {t('cart.processing')}
                      </>
                    ) : (
                      <>
                        {t('cart.checkout')}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Trip Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Items</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {cartItems.length} {cartItems.length === 1 ? 'vehicle' : 'vehicles'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    ₫{(totalPrice - serviceFee).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    ₫{serviceFee.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      ₫{totalPrice.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {cartItems.length > 1 && (
                <button
                  onClick={handleCheckoutAll}
                  disabled={!!processing}
                  className="w-full px-6 py-4 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  Checkout All
                </button>
              )}

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Full Protection</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comprehensive insurance included</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">24/7 Support</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Round-the-clock assistance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Free Cancellation</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cancel up to 24 hours before</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

