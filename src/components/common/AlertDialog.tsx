import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}: AlertDialogProps) {
  if (!isOpen) return null;

  const iconConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 ${config.bgColor} rounded-full`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${config.buttonClass}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

