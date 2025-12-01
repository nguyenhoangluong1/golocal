import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hostBookingsAPI } from '../utils/api';
import { Calendar, MapPin, User, CheckCircle, XCircle, MessageSquare, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../hooks/useDialog';

interface Booking {
  id: string;
  vehicle: {
    id: string;
    name: string;
    images?: string[];
  };
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  pickup_location?: string;
  return_location?: string;
  notes?: string;
  rejection_reason?: string;
}

export default function BookingApprovalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert, DialogComponents } = useDialog();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messageText, setMessageText] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await hostBookingsAPI.getPendingApproval();
      setBookings(response.data || []);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      showAlert('Error', error.response?.data?.detail || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking: Booking, message?: string) => {
    try {
      setProcessingId(booking.id);
      await hostBookingsAPI.approveBooking(booking.id, message ? { message } : {});
      await loadBookings();
      showAlert('Success', 'Booking approved successfully!', 'success');
      setShowMessageModal(false);
      setSelectedBooking(null);
      setMessageText('');
    } catch (error: any) {
      console.error('Failed to approve booking:', error);
      showAlert('Error', error.response?.data?.detail || 'Failed to approve booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (booking: Booking, reason: string, message?: string) => {
    if (!reason.trim()) {
      showAlert('Validation Error', 'Please provide a rejection reason', 'warning');
      return;
    }

    try {
      setProcessingId(booking.id);
      await hostBookingsAPI.rejectBooking(booking.id, {
        rejection_reason: reason,
        message: message || '',
      });
      await loadBookings();
      showAlert('Success', 'Booking rejected', 'success');
      setShowMessageModal(false);
      setSelectedBooking(null);
      setMessageText('');
      setRejectionReason('');
    } catch (error: any) {
      console.error('Failed to reject booking:', error);
      showAlert('Error', error.response?.data?.detail || 'Failed to reject booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openMessageModal = (booking: Booking, type: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setActionType(type);
    setShowMessageModal(true);
    setMessageText('');
    setRejectionReason('');
  };

  const submitWithMessage = () => {
    if (!selectedBooking) return;

    if (actionType === 'approve') {
      handleApprove(selectedBooking, messageText || undefined);
    } else if (actionType === 'reject') {
      if (!rejectionReason.trim()) {
        showAlert('Validation Error', 'Please provide a rejection reason', 'warning');
        return;
      }
      handleReject(selectedBooking, rejectionReason, messageText || undefined);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view booking requests
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage booking requests for your vehicles
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No pending bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have any booking requests at the moment
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Vehicle Image */}
                  <div className="lg:w-64 flex-shrink-0">
                    {booking.vehicle.images && booking.vehicle.images.length > 0 ? (
                      <img
                        src={booking.vehicle.images[0]}
                        alt={booking.vehicle.name}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {booking.vehicle.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{booking.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(booking.start_date).toLocaleDateString()} -{' '}
                              {new Date(booking.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-semibold">
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            <strong>Pickup:</strong> {booking.pickup_location || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            <strong>Return:</strong> {booking.return_location || 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Duration:</strong> {calculateDays(booking.start_date, booking.end_date)} days
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₫{booking.total_price.toLocaleString('vi-VN')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Price
                        </div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openMessageModal(booking, 'approve')}
                        disabled={processingId === booking.id}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => openMessageModal(booking, 'reject')}
                        disabled={processingId === booking.id}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                      <button
                        onClick={() => navigate(`/messages?booking=${booking.id}`)}
                        className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
              </h3>

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all resize-none"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Optional Message to Customer
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all resize-none"
                  placeholder={actionType === 'approve' 
                    ? "Send a welcome message to the customer..." 
                    : "Send a message explaining the rejection..."}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedBooking(null);
                    setMessageText('');
                    setRejectionReason('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithMessage}
                  disabled={processingId === selectedBooking.id || (actionType === 'reject' && !rejectionReason.trim())}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {processingId === selectedBooking.id ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <DialogComponents />
    </div>
  );
}

