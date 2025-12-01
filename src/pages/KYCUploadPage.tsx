import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { kycAPI, imagesAPI } from '../utils/api';
import { validateImageFile, resizeImage, createImagePreview } from '../utils/imageUtils';
import { Upload, X, CheckCircle, AlertCircle, FileText, Camera, CreditCard, Sparkles } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

type DocumentType = 'ID_CARD' | 'DRIVER_LICENSE' | 'PASSPORT';

interface KYCStatus {
  kyc_status: string;
  kyc_verified_at?: string;
  latest_document?: {
    id: string;
    status: string;
    document_type: string;
    rejection_reason?: string;
  };
}

export default function KYCUploadPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showAlert, DialogComponents } = useDialog();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [documentType, setDocumentType] = useState<DocumentType>('ID_CARD');
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadKYCStatus();
  }, [isAuthenticated, navigate, authLoading]);

  const loadKYCStatus = async () => {
    try {
      setLoading(true);
      const response = await kycAPI.getStatus();
      setKycStatus(response.data);
    } catch (error) {
      console.error('Failed to load KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (
    file: File,
    type: 'front' | 'back' | 'selfie'
  ) => {
    // Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showAlert('Invalid Image', validation.error || 'Please select a valid image file', 'error');
      return;
    }

    // Resize image
    try {
      const resized = await resizeImage(file, 1920, 1920, 0.9);
      
      // Create preview
      const preview = await createImagePreview(resized);
      
      if (type === 'front') {
        setFrontImage(resized);
        setFrontPreview(preview);
      } else if (type === 'back') {
        setBackImage(resized);
        setBackPreview(preview);
      } else {
        setSelfieImage(resized);
        setSelfiePreview(preview);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      showAlert('Error', 'Error processing image. Please try again.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!frontImage) {
      showAlert('Validation Error', 'Please upload the front side of your document', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // Upload images to storage
      const uploadPromises = [];
      
      if (frontImage) {
        uploadPromises.push(
          imagesAPI.uploadBase64(
            await fileToBase64(frontImage),
            'kyc_documents',
            `${user?.id}/front-${Date.now()}.jpg`
          )
        );
      }
      
      if (backImage) {
        uploadPromises.push(
          imagesAPI.uploadBase64(
            await fileToBase64(backImage),
            'kyc_documents',
            `${user?.id}/back-${Date.now()}.jpg`
          )
        );
      }
      
      if (selfieImage) {
        uploadPromises.push(
          imagesAPI.uploadBase64(
            await fileToBase64(selfieImage),
            'kyc_documents',
            `${user?.id}/selfie-${Date.now()}.jpg`
          )
        );
      }

      const uploadResults = await Promise.all(uploadPromises);
      
      // Submit KYC
      const kycData: any = {
        document_type: documentType,
        document_front_url: uploadResults[0].data.url,
      };

      if (uploadResults[1]) {
        kycData.document_back_url = uploadResults[1].data.url;
      }
      if (uploadResults[2]) {
        kycData.selfie_url = uploadResults[2].data.url;
      }
      if (documentNumber) {
        kycData.document_number = documentNumber;
      }
      if (expiresAt) {
        kycData.expires_at = expiresAt;
      }

      await kycAPI.submit(kycData);
      
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Failed to submit KYC:', error);
      showAlert('Error', error.response?.data?.detail || 'Error submitting KYC. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file'));
        }
      };
      reader.onerror = reject;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if already verified or pending
  const currentStatus = kycStatus?.kyc_status;
  const latestDoc = kycStatus?.latest_document;

  if (currentStatus === 'VERIFIED') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              KYC Verified
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account has been successfully verified
            </p>
            {kycStatus?.kyc_verified_at && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verified on: {new Date(kycStatus.kyc_verified_at).toLocaleDateString('en-US')}
              </p>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="mt-6 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (latestDoc?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              KYC Pending Review
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your documents are being reviewed by admin. Please wait for notification.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-6 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (latestDoc?.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              KYC Rejected
            </h2>
            {latestDoc.rejection_reason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {latestDoc.rejection_reason}
                </p>
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Please resubmit with clearer documents.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setFrontImage(null);
                  setBackImage(null);
                  setSelfieImage(null);
                  setFrontPreview('');
                  setBackPreview('');
                  setSelfiePreview('');
                }}
                className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Nộp Lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleIn">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                🎉 Congratulations!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                Your KYC has been submitted successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please wait for admin review. We'll notify you as soon as we have the results.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>You're one step closer to identity verification!</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                navigate('/profile');
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Verification (KYC)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your ID card or driver's license to verify your account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {/* Document Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Document Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['ID_CARD', 'DRIVER_LICENSE', 'PASSPORT'] as DocumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocumentType(type)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    documentType === type
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700'
                  }`}
                >
                  {type === 'ID_CARD' && <CreditCard className="w-8 h-8 mx-auto mb-2 text-rose-600 dark:text-rose-400" />}
                  {type === 'DRIVER_LICENSE' && <FileText className="w-8 h-8 mx-auto mb-2 text-rose-600 dark:text-rose-400" />}
                  {type === 'PASSPORT' && <FileText className="w-8 h-8 mx-auto mb-2 text-rose-600 dark:text-rose-400" />}
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {type === 'ID_CARD' && 'ID Card'}
                    {type === 'DRIVER_LICENSE' && 'Driver License'}
                    {type === 'PASSPORT' && 'Passport'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Document Number (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Document Number (Optional)
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter ID/driver license number..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Expiry Date (Optional) */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Image Upload Sections */}
          <div className="space-y-6">
            {/* Front Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Front Side Photo <span className="text-red-500">*</span>
              </label>
              {frontPreview ? (
                <div className="relative">
                  <img
                    src={frontPreview}
                    alt="Front"
                    className="w-full h-64 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => {
                      setFrontImage(null);
                      setFrontPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-rose-500 dark:hover:border-rose-500 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload front side photo
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      JPG, PNG (max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageSelect(e.target.files[0], 'front');
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Back Image (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Back Side Photo (Optional)
              </label>
              {backPreview ? (
                <div className="relative">
                  <img
                    src={backPreview}
                    alt="Back"
                    className="w-full h-64 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => {
                      setBackImage(null);
                      setBackPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-rose-500 dark:hover:border-rose-500 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload back side photo
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      JPG, PNG (max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageSelect(e.target.files[0], 'back');
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Selfie (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Selfie Photo (Optional)
              </label>
              {selfiePreview ? (
                <div className="relative">
                  <img
                    src={selfiePreview}
                    alt="Selfie"
                    className="w-full h-64 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => {
                      setSelfieImage(null);
                      setSelfiePreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-rose-500 dark:hover:border-rose-500 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload selfie photo
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      JPG, PNG (max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageSelect(e.target.files[0], 'selfie');
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!frontImage || submitting}
              className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </div>
        </div>
      </div>
      <DialogComponents />
    </Fragment>
  );
}

