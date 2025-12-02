import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { Car, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertDialog from '../components/common/AlertDialog';
import { useI18n } from '../contexts/I18nContext';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  brand: string;
  price_per_day: number;
  city: string;
  verification_status: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  images: string[];
  created_at: string;
}

export default function AdminVehiclesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [verificationFilter, setVerificationFilter] = useState(
    searchParams.get('verification_status') || 'PENDING'
  );
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; vehicleId: string; vehicleName: string } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync filter with URL params on mount
  useEffect(() => {
    const verificationParam = searchParams.get('verification_status');
    if (verificationParam && verificationParam !== verificationFilter) {
      setVerificationFilter(verificationParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (user?.role === 'admin') {
      loadVehicles();
    }
  }, [user, navigate, page, verificationFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (verificationFilter) params.verification_status = verificationFilter;

      const response = await adminAPI.getVehicles(params);
      setVehicles(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (vehicleId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await adminAPI.verifyVehicle(vehicleId, {
        verification_status: status,
        rejection_reason: reason || undefined,
      });
      loadVehicles();
      setAlertDialog({
        isOpen: true,
        title: t('common.success'),
        message: status === 'APPROVED' ? t('admin.vehicles.approved') : t('admin.vehicles.rejected'),
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to verify vehicle:', error);
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: error.response?.data?.detail || t('admin.vehicles.verifyFailed'),
        type: 'error',
      });
    }
  };

  const handleDeleteClick = (vehicleId: string, vehicleName: string) => {
    setDeleteDialog({
      isOpen: true,
      vehicleId,
      vehicleName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    
    setIsDeleting(true);
    try {
      await adminAPI.deleteVehicle(deleteDialog.vehicleId);
      setDeleteDialog(null);
      loadVehicles();
      setAlertDialog({
        isOpen: true,
        title: t('common.success'),
        message: t('admin.vehicles.vehicleDeleted'),
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete vehicle:', error);
      setDeleteDialog(null);
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: error.response?.data?.detail || t('admin.vehicles.deleteFailed'),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
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
              {t('admin.vehicles.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.vehicles.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('common.back')} to {t('admin.dashboard.title')}
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t('admin.vehicles.allStatus')}</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Vehicles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('admin.vehicles.loading')}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('admin.vehicles.noVehicles')}</p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      vehicle.verification_status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      vehicle.verification_status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {vehicle.verification_status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {vehicle.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div>{vehicle.brand} • {vehicle.type}</div>
                    <div>{vehicle.city}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ₫{vehicle.price_per_day.toLocaleString('vi-VN')}/day
                    </div>
                    <div className="text-xs">
                      {t('vehicle.owner')}: {vehicle.owner?.name || t('vehicle.unknown')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {vehicle.verification_status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(vehicle.id, 'APPROVED')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('admin.vehicles.approve')}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt(t('booking.rejectionReason'));
                            if (reason) handleVerify(vehicle.id, 'REJECTED', reason);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('admin.vehicles.reject')}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteClick(vehicle.id, vehicle.name)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('admin.vehicles.deleteVehicle')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} vehicles
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog(null)}
          onConfirm={handleDeleteConfirm}
          title={t('admin.vehicles.deleteVehicle')}
          message={t('admin.vehicles.deleteConfirm')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={isDeleting}
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
    </div>
  );
}

