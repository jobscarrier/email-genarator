import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, description?: string) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', description?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, type, message, description }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="bg-zinc-900/95 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-800 text-white p-4 rounded-xl shadow-2xl flex gap-3 items-start cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => removeToast(t.id)}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                {t.type === 'error' && <XCircle className="h-5 w-5 text-rose-450" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-blue-450" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-zinc-100">{t.message}</p>
                {t.description && (
                  <p className="font-sans text-xs text-zinc-400 mt-1">{t.description}</p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(t.id);
                }}
                className="shrink-0 text-zinc-500 hover:text-zinc-350"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
