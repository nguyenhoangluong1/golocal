import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertDialog from '../components/common/AlertDialog';

export function useDialog() {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
  } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
    }
  ) => {
    const handleConfirm = async () => {
      setIsLoading(true);
      try {
        await onConfirm();
        setConfirmDialog(null);
      } catch (error) {
        // Keep dialog open on error, let caller handle it
        console.error('Confirm action error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: handleConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      confirmButtonClass: options?.confirmButtonClass,
    });
  }, []);

  const showAlert = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const DialogComponents = () => (
    <>
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          confirmButtonClass={confirmDialog.confirmButtonClass}
          isLoading={isLoading}
        />
      )}
      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog(null)}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
        />
      )}
    </>
  );

  return {
    showConfirm,
    showAlert,
    DialogComponents,
  };
}

