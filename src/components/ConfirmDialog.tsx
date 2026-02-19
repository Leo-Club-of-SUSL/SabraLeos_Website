import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}

const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel, variant = 'danger' }: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const btnColor = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}
                style={{ animation: 'dialogPop 0.2s ease-out' }}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
                </div>
                <div className="flex border-t border-gray-100 dark:border-slate-700">
                    <button onClick={onCancel} className="flex-1 px-4 py-3.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-3.5 text-white font-bold transition-colors ${btnColor}`}>
                        {confirmLabel}
                    </button>
                </div>
                <style>{`@keyframes dialogPop { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`}</style>
            </div>
        </div>
    );
};

export default ConfirmDialog;
