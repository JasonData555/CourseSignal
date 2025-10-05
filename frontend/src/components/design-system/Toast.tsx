import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Toast({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (autoClose && type === 'success') {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose, type]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-600" />,
    error: <XCircle className="w-5 h-5 text-danger-600" />,
    warning: <AlertCircle className="w-5 h-5 text-warning-600" />,
    info: <AlertCircle className="w-5 h-5 text-primary-600" />,
  };

  const bgColors = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };

  const textColors = {
    success: 'text-success-800',
    error: 'text-danger-800',
    warning: 'text-warning-800',
    info: 'text-primary-800',
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        bgColors[type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <p className={clsx('flex-1 text-sm font-medium', textColors[type])}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={clsx('flex-shrink-0 hover:opacity-70', textColors[type])}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {children}
    </div>
  );
}
