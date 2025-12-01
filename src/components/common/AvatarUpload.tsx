import { useState } from 'react';
import { Edit2, Upload, X, Check } from 'lucide-react';
import { validateImageFile, resizeImage, createImagePreview } from '../../utils/imageUtils';
import { useDialog } from '../../hooks/useDialog';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUpload: (avatarData: string) => Promise<void>;
}

export default function AvatarUpload({ currentAvatar, userName, onUpload }: AvatarUploadProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { showAlert, DialogComponents } = useDialog();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showAlert('Invalid Image', validation.error || 'Please select an image file (JPG, PNG, GIF)', 'error');
      return;
    }

    try {
      setProcessing(true);
      
      // Resize image to avatar size (400x400 max, but will be displayed at 160x160)
      const resized = await resizeImage(file, 400, 400, 0.9);
      setAvatarFile(resized);
      
      // Create preview from resized image
      const preview = await createImagePreview(resized);
      setAvatarPreview(preview);
    } catch (error) {
      console.error('Error processing image:', error);
      showAlert('Error', 'Error processing image. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!avatarPreview) return;

    try {
      setUploading(true);
      await onUpload(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error('Upload failed:', error);
      showAlert('Error', error.response?.data?.detail || 'Failed to update avatar. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  return (
    <div className="relative w-full">
      {/* Avatar Display */}
      <div className="relative w-40 h-40 mx-auto" style={{ maxWidth: '160px', maxHeight: '160px', minWidth: '160px', minHeight: '160px' }}>
        <div className="w-full h-full rounded-2xl border-4 border-white dark:border-gray-800 bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl overflow-hidden ring-4 ring-gray-200/50 dark:ring-gray-700/50 transition-all hover:ring-rose-300 dark:hover:ring-rose-700" style={{ width: '160px', height: '160px' }}>
          {processing ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block'
              }}
            />
          ) : currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt={userName} 
              className="w-full h-full object-cover" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block'
              }}
            />
          ) : (
            userName?.charAt(0).toUpperCase()
          )}
          
          {/* Overlay when hovering */}
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer rounded-2xl"
          >
            <div className="text-center text-white">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-semibold">Change Photo</span>
            </div>
          </label>
        </div>

        {/* Edit Button - Floating */}
        <label
          htmlFor="avatar-upload"
          className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-full shadow-xl border-4 border-white dark:border-gray-800 hover:from-rose-600 hover:to-pink-700 cursor-pointer transition-all transform hover:scale-110 z-10"
        >
          <Edit2 className="w-5 h-5" />
        </label>
      </div>

      {/* Hidden File Input */}
      <input
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview Actions - Better positioned */}
      {avatarPreview && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* File Info */}
          {avatarFile && (
            <div className="text-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{avatarFile.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{(avatarFile.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save Avatar</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {avatarPreview === null && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`absolute inset-0 rounded-2xl border-2 border-dashed transition-all ${
            dragActive
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/30'
              : 'border-transparent'
          } pointer-events-none`}
        />
      )}
      <DialogComponents />
    </div>
  );
}
