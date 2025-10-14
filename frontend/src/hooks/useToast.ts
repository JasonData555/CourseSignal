import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: { autoClose?: boolean; duration?: number }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      type,
      message,
      autoClose: options?.autoClose ?? true,
      duration: options?.duration ?? 3000,
    };

    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return showToast('success', message, options);
  }, [showToast]);

  const error = useCallback((message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return showToast('error', message, { autoClose: false, ...options });
  }, [showToast]);

  const warning = useCallback((message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return showToast('warning', message, options);
  }, [showToast]);

  const info = useCallback((message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return showToast('info', message, options);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
