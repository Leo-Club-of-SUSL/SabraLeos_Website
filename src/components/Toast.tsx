import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================
// Types
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ============================================
// Toast Context
// ============================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

// ============================================
// Toast Provider & Renderer
// ============================================

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// ============================================
// Individual Toast
// ============================================

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500', text: 'text-emerald-800 dark:text-emerald-200' },
    error: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', text: 'text-red-800 dark:text-red-200' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', text: 'text-amber-800 dark:text-amber-200' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-800 dark:text-blue-200' },
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
    const [isLeaving, setIsLeaving] = useState(false);
    const Icon = icons[toast.type];
    const color = colors[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-xl border shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px] transition-all duration-300 ${isLeaving ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
                } ${color.bg} ${color.border}`}
            style={{ animation: isLeaving ? 'none' : 'slideInRight 0.3s ease-out' }}
        >
            <Icon size={20} className={`${color.icon} shrink-0 mt-0.5`} />
            <p className={`text-sm font-medium flex-1 ${color.text}`}>{toast.message}</p>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                <X size={16} />
            </button>
            <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </div>
    );
};
