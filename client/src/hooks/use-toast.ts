// Simple toast notification system
import { useState, useCallback } from "react";

type ToastType = "default" | "success" | "error" | "destructive" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const newToast: Toast = {
      id: Math.random().toString(36).substring(2, 9),
      title: options.title,
      description: options.description,
      variant: options.variant || "default",
      duration: options.duration || 5000,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Remove toast after duration
    setTimeout(() => {
      setToasts((prevToasts) => 
        prevToasts.filter((toast) => toast.id !== newToast.id)
      );
    }, newToast.duration);
    
    return newToast.id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toast, dismiss, toasts };
}

export type { Toast, ToastOptions };