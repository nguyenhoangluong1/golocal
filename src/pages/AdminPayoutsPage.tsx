import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { Wallet, Search, CheckCircle, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../hooks/useDialog';

interface Payout {
  id: string;
  booking_id: string;
  user_id: string;
  host_id: string;
  amount: number;
  host_payout_amount: number;
  commission_amount: number;
  payout_status: string;
  payment_status: string;
  paid_at: string;
  created_at: string;
  booking?: {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  host?: {
    id: string;
    name: string;
    email: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showConfirm, showAlert, DialogComponents } = useDialog();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    payment_method: 'BANK_TRANSFER',
    transaction_reference: '',
    notes: '',
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (user?.role === 'admin') {
      loadPayouts();
    }
  }, [user, navigate, page]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.host_id = search;

      const response = await adminAPI.getPendingPayouts(params);
      setPayouts(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPayouts();
  };

  const handleReleasePayout = () => {
    if (!selectedPayout) return;

    showConfirm(
      'Release Payout',
      `Are you sure you want to release payout of ₫${selectedPayout.host_payout_amount.toLocaleString('vi-VN')} to ${selectedPayout.host?.name || 'host'}?`,
      async () => {
        try {
          setReleasing(true);
          await adminAPI.releasePayout({
            payment_id: selectedPayout.id,
            payment_method: releaseForm.payment_method,
            transaction_reference: releaseForm.transaction_reference || undefined,
            notes: releaseForm.notes || undefined,
          });
          
          setShowReleaseModal(false);
          setSelectedPayout(null);
          setReleaseForm({
            payment_method: 'BANK_TRANSFER',
            transaction_reference: '',
            notes: '',
          });
          loadPayouts();
          showAlert('Success', 'Payout released successfully!', 'success');
        } catch (error: any) {
          console.error('Failed to release payout:', error);
          showAlert('Error', error.response?.data?.detail || 'Failed to release payout', 'error');
        } finally {
          setReleasing(false);
        }
      },
      { confirmText: 'Release', confirmButtonClass: 'bg-green-600 hover:bg-green-700' }
    );
  };

  const openReleaseModal = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowReleaseModal(true);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payout Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and release payouts to vehicle hosts
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by host ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payouts...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No pending payouts found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Host
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payout Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Paid At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 dark:text-white">
                            {payout.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payout.host?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {payout.host?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payout.customer?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payout.customer?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payout.booking ? (
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(payout.booking.start_date).toLocaleDateString('vi-VN')} - {new Date(payout.booking.end_date).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {payout.booking.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ₫{payout.amount.toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ₫{payout.host_payout_amount.toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            ₫{payout.commission_amount.toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payout.paid_at ? new Date(payout.paid_at).toLocaleTimeString('vi-VN') : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openReleaseModal(payout)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} payouts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * 20 >= total}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Release Payout Modal */}
      {showReleaseModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Release Payout
              </h2>
              <button
                onClick={() => {
                  setShowReleaseModal(false);
                  setSelectedPayout(null);
                  setReleaseForm({
                    payment_method: 'BANK_TRANSFER',
                    transaction_reference: '',
                    notes: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Host</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedPayout.host?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Payout Amount</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    ₫{selectedPayout.host_payout_amount.toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={releaseForm.payment_method}
                  onChange={(e) => setReleaseForm({ ...releaseForm, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="STRIPE_CONNECT">Stripe Connect</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={releaseForm.transaction_reference}
                  onChange={(e) => setReleaseForm({ ...releaseForm, transaction_reference: e.target.value })}
                  placeholder="e.g., Bank transaction ID"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={releaseForm.notes}
                  onChange={(e) => setReleaseForm({ ...releaseForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setShowReleaseModal(false);
                  setSelectedPayout(null);
                  setReleaseForm({
                    payment_method: 'BANK_TRANSFER',
                    transaction_reference: '',
                    notes: '',
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReleasePayout}
                disabled={releasing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {releasing ? 'Releasing...' : 'Release Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogComponents />
    </div>
  );
}

