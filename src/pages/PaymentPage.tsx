import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { paymentsAPI } from '../utils/api';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard, ChevronDown, Building2 } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

interface PaymentState {
  paymentIntentId: string;
  clientSecret: string;
  bookingId: string;
  amount: number;
  vehicleName: string;
}

interface PaymentDetails {
  id: string;
  amount: number;
  commission_amount?: number;
  host_payout_amount?: number;
  commission_rate?: number;
  payout_status?: string;
  payment_status: string;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { showAlert, DialogComponents } = useDialog();
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  
  // Payment method form
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [cardType, setCardType] = useState<string>('visa'); // visa, mastercard, amex, discover, jcb, diners
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');

  // Auto-detect card type from card number
  const detectCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3') && (cleanNumber.startsWith('34') || cleanNumber.startsWith('37'))) return 'amex';
    if (cleanNumber.startsWith('6011') || cleanNumber.startsWith('65')) return 'discover';
    if (cleanNumber.startsWith('35')) return 'jcb';
    if (cleanNumber.startsWith('30') || cleanNumber.startsWith('36') || cleanNumber.startsWith('38')) return 'diners';
    return cardType; // Keep current selection if can't detect
  };

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get payment state from navigation
    const state = location.state as PaymentState;
    if (!state || !state.paymentIntentId || !state.clientSecret) {
      showAlert(t('payment.invalidPayment'), t('payment.invalidPaymentInfo'), 'error');
      navigate('/');
      return;
    }

    setPaymentState(state);
  }, [location, isAuthenticated, navigate]);

  const handlePayment = async () => {
    if (!paymentState) return;

    // Validate card details
    if (paymentMethod === 'card') {
      const cardNum = cardNumber.replace(/\s/g, '');
      if (cardNum.length < 13 || cardNum.length > 19) {
        setError('Please enter a valid card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length !== 5) {
        setError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (!cardCVC || cardCVC.length < 3) {
        setError('Please enter a valid CVC');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter cardholder name');
        return;
      }
    }

    try {
      setProcessing(true);
      setPaymentStatus('processing');
      setError(null);

      // Confirm payment
      const response = await paymentsAPI.confirm({
        payment_intent_id: paymentState.paymentIntentId,
        booking_id: paymentState.bookingId,
      });

      if (response.data.payment_status === 'SUCCEEDED') {
        setPaymentStatus('success');
        setPaymentDetails(response.data);
        // Don't auto-redirect, let user stay on success page
      } else {
        setPaymentStatus('failed');
        setError(t('payment.paymentFailedTryAgain'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
        setError(error.response?.data?.detail || t('payment.errorOccurred'));
    } finally {
      setProcessing(false);
    }
  };

  if (!paymentState) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Stripe Branding */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back')}</span>
          </button>
          
          {/* Stripe Logo & Branding */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('payment.completePayment')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t('payment.securePayment')}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.549-.795-6.824-1.932l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stripe</span>
            </div>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Stripe Header Bar */}
          <div className="bg-gradient-to-r from-[#635BFF] to-[#8B80FF] px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">{t('payment.securePaymentTitle')}</h2>
                  <p className="text-white/80 text-sm">{t('payment.poweredByStripe')}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-white text-xs font-medium">{t('payment.testMode')}</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
          {/* Booking Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#635BFF] rounded-full"></div>
              Booking Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-600 dark:text-gray-400">{t('payment.vehicle')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{paymentState.vehicleName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-600 dark:text-gray-400">{t('payment.bookingId')}</span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{paymentState.bookingId.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('payment.totalAmount')}</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-[#635BFF] to-[#8B80FF] bg-clip-text text-transparent">
                  ₫{paymentState.amount.toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status - Success */}
          {paymentStatus === 'success' && paymentDetails && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">
                    {t('payment.paymentSuccessful')}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-500 mb-4">
                    Your payment of <strong>₫{paymentDetails.amount.toLocaleString('vi-VN')}</strong> has been processed successfully.
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    Your booking is now confirmed. You will receive a confirmation email shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-400">
                  {t('payment.paymentFailed')}
                </p>
                {error && (
                  <p className="text-sm text-red-700 dark:text-red-500 mt-1">{error}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {paymentStatus === 'idle' && (
            <div className="space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#635BFF] rounded-full"></div>
                  {t('payment.selectPaymentMethod')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-5 border-2 rounded-xl transition-all flex flex-col items-center gap-3 ${
                      paymentMethod === 'card'
                        ? 'border-[#635BFF] bg-gradient-to-br from-[#635BFF]/10 to-[#8B80FF]/10 dark:from-[#635BFF]/20 dark:to-[#8B80FF]/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${paymentMethod === 'card' ? 'bg-[#635BFF]' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>
                    <span className="font-semibold text-sm">{t('payment.creditDebitCard')}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <img 
                        src="https://cdn.simpleicons.org/visa/1A1F71" 
                        alt="Visa" 
                        className="h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <img 
                        src="https://cdn.simpleicons.org/mastercard/EB001B" 
                        alt="Mastercard" 
                        className="h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <img 
                        src="https://cdn.simpleicons.org/americanexpress/006FCF" 
                        alt="Amex" 
                        className="h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    disabled
                    className="p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl opacity-50 cursor-not-allowed flex flex-col items-center gap-3 relative"
                  >
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="font-semibold text-sm">{t('payment.bankTransfer')}</span>
                    <span className="text-xs text-gray-500 absolute bottom-2">{t('payment.comingSoon')}</span>
                  </button>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#635BFF] rounded-full"></div>
                      Card Details
                    </h3>
                  </div>

                  {/* Card Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Type
                    </label>
                    <div className="relative">
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        className="w-full pl-20 pr-12 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 dark:focus:ring-[#8B80FF]/20 outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">{t('payment.americanExpress')}</option>
                        <option value="discover">Discover</option>
                        <option value="jcb">JCB</option>
                        <option value="diners">{t('payment.dinersClub')}</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                      {/* Card Icon Preview */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {cardType === 'visa' && (
                          <img 
                            src="https://cdn.simpleicons.org/visa/1A1F71" 
                            alt="Visa" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'mastercard' && (
                          <img 
                            src="https://cdn.simpleicons.org/mastercard/EB001B" 
                            alt="Mastercard" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Mastercard-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'amex' && (
                          <img 
                            src="https://cdn.simpleicons.org/americanexpress/006FCF" 
                            alt={t('payment.americanExpress')} 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/American-Express-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'discover' && (
                          <img 
                            src="https://cdn.simpleicons.org/discover/FF6000" 
                            alt="Discover" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Discover-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'jcb' && (
                          <img 
                            src="https://cdn.simpleicons.org/jcb/0E4C96" 
                            alt="JCB" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/JCB-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'diners' && (
                          <img 
                            src="https://cdn.simpleicons.org/dinersclub/0079BE" 
                            alt={t('payment.dinersClub')} 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Diners-Club-Logo.png';
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          setCardNumber(formatted.substring(0, cardType === 'amex' ? 17 : 19));
                          // Auto-detect card type
                          if (value.length > 0) {
                            const detected = detectCardType(value);
                            if (detected !== cardType) {
                              setCardType(detected);
                            }
                          }
                        }}
                        placeholder={cardType === 'amex' ? "3782 822463 10005" : "1234 5678 9012 3456"}
                        maxLength={cardType === 'amex' ? 17 : 19}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 dark:focus:ring-[#8B80FF]/20 outline-none transition-all font-medium text-lg tracking-wide pr-16"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {cardType === 'visa' && (
                          <img 
                            src="https://cdn.simpleicons.org/visa/1A1F71" 
                            alt="Visa" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'mastercard' && (
                          <img 
                            src="https://cdn.simpleicons.org/mastercard/EB001B" 
                            alt="Mastercard" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Mastercard-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'amex' && (
                          <img 
                            src="https://cdn.simpleicons.org/americanexpress/006FCF" 
                            alt={t('payment.americanExpress')} 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/American-Express-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'discover' && (
                          <img 
                            src="https://cdn.simpleicons.org/discover/FF6000" 
                            alt="Discover" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Discover-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'jcb' && (
                          <img 
                            src="https://cdn.simpleicons.org/jcb/0E4C96" 
                            alt="JCB" 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/JCB-Logo.png';
                            }}
                          />
                        )}
                        {cardType === 'diners' && (
                          <img 
                            src="https://cdn.simpleicons.org/dinersclub/0079BE" 
                            alt={t('payment.dinersClub')} 
                            className="w-12 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2020/04/Diners-Club-Logo.png';
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.length >= 2 
                            ? `${value.substring(0, 2)}/${value.substring(2, 4)}`
                            : value;
                          setCardExpiry(formatted.substring(0, 5));
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 dark:focus:ring-[#8B80FF]/20 outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={cardCVC}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setCardCVC(value.substring(0, 4));
                        }}
                        placeholder={cardType === 'amex' ? "1234" : "123"}
                        maxLength={cardType === 'amex' ? 4 : 3}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 dark:focus:ring-[#8B80FF]/20 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#635BFF] dark:focus:border-[#8B80FF] focus:ring-2 focus:ring-[#635BFF]/20 dark:focus:ring-[#8B80FF]/20 outline-none transition-all"
                    />
                  </div>

                </div>
              )}
            </div>
          )}

          </div>
          
          {/* Action Buttons */}
          <div className="px-8 pb-8 pt-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              {paymentStatus === 'idle' && (
                <button
                  onClick={handlePayment}
                  disabled={processing || (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCVC || !cardName))}
                  className="flex-1 py-4 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] hover:from-[#5851EA] hover:to-[#7B73FF] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('payment.processingPayment')}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>{t('payment.pay')} ₫{paymentState.amount.toLocaleString('vi-VN')}</span>
                    </>
                  )}
                </button>
              )}

              {paymentStatus === 'failed' && (
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 py-4 bg-gradient-to-r from-[#635BFF] to-[#8B80FF] hover:from-[#5851EA] hover:to-[#7B73FF] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    t('payment.tryAgain')
                  )}
                </button>
              )}

              {paymentStatus === 'success' && (
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'bookings' } })}
                  className="flex-1 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  View My Bookings
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice - Stripe Branded */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('payment.securedBy')}</span>
            <svg className="w-12 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.549-.795-6.824-1.932l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF"/>
            </svg>
          </div>
        </div>
      </div>
      <DialogComponents />
    </div>
  );
}

