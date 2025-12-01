import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDialog } from '../hooks/useDialog';

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_number?: string;
  document_front_url: string;
  document_back_url?: string;
  selfie_url?: string;
  status: string;
  rejection_reason?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  submitted_at: string;
}

export default function AdminKYCPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert, DialogComponents } = useDialog();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'PENDING');
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (user?.role === 'admin') {
      loadDocuments();
    }
  }, [user, navigate, page, statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await adminAPI.getPendingKYC(params);
      if (statusFilter === 'PENDING') {
        setDocuments(response.data.data || []);
        setTotal(response.data.total || 0);
      } else {
        const allResponse = await adminAPI.getAllKYC(params);
        setDocuments(allResponse.data.data || []);
        setTotal(allResponse.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      if (status === 'REJECTED' && !rejectionReason.trim()) {
        showAlert('Validation Error', 'Please enter rejection reason', 'warning');
        return;
      }

      await adminAPI.reviewKYC(docId, {
        status,
        rejection_reason: status === 'REJECTED' ? rejectionReason : undefined,
      });

      setSelectedDoc(null);
      setRejectionReason('');
      loadDocuments();
      showAlert('Success', `KYC document ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`, 'success');
    } catch (error: any) {
      console.error('Failed to review KYC:', error);
      showAlert('Error', error.response?.data?.detail || 'Error reviewing KYC', 'error');
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
              KYC Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and verify user identity documents
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Documents List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading KYC documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No KYC documents found</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
              >
                {/* Document Preview */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  <img
                    src={doc.document_front_url}
                    alt="Document front"
                    className="w-full h-full object-contain"
                    onClick={() => setSelectedDoc(doc)}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      doc.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      doc.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>

                {/* Document Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">User</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{doc.user?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doc.user?.email}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {doc.document_type === 'ID_CARD' ? 'ID Card' :
                       doc.document_type === 'DRIVER_LICENSE' ? 'Driver License' :
                       'Passport'}
                    </p>
                    {doc.document_number && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Number: {doc.document_number}
                      </p>
                    )}
                  </div>

                  {doc.status === 'PENDING' && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} documents
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review KYC Document
                </h2>
                <button
                  onClick={() => {
                    setSelectedDoc(null);
                    setRejectionReason('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* User Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">User</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDoc.user?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedDoc.user?.email}</p>
                  {selectedDoc.user?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedDoc.user.phone}</p>
                  )}
                </div>

                {/* Document Images */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Front Side
                    </p>
                    <img
                      src={selectedDoc.document_front_url}
                      alt="Front"
                      className="w-full h-64 object-contain border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                  {selectedDoc.document_back_url && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Back Side
                      </p>
                      <img
                        src={selectedDoc.document_back_url}
                        alt="Back"
                        className="w-full h-64 object-contain border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                  )}
                  {selectedDoc.selfie_url && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Selfie
                      </p>
                      <img
                        src={selectedDoc.selfie_url}
                        alt="Selfie"
                        className="w-full h-64 object-contain border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Document Details */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.document_type === 'ID_CARD' ? 'ID Card' :
                     selectedDoc.document_type === 'DRIVER_LICENSE' ? 'Driver License' :
                     'Passport'}
                  </p>
                  {selectedDoc.document_number && (
                    <>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-1">Document Number</p>
                      <p className="text-gray-900 dark:text-white">{selectedDoc.document_number}</p>
                    </>
                  )}
                </div>

                {/* Rejection Reason Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason (If rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Enter rejection reason if you are rejecting this KYC..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedDoc(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReview(selectedDoc.id, 'REJECTED')}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview(selectedDoc.id, 'APPROVED')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <DialogComponents />
    </div>
  );
}

