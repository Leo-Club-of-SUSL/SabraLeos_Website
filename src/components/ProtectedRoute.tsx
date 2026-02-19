import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Shield } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, signOut } = useAuth();
    const hasMounted = useRef(false);

    // Auto sign-out when leaving the admin area
    useEffect(() => {
        hasMounted.current = true;
        return () => {
            if (hasMounted.current) {
                signOut();
            }
        };
    }, [signOut]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 bg-[var(--color-leo-maroon)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-[var(--color-leo-maroon)]" size={32} />
                    </div>
                    <Loader2 size={28} className="animate-spin text-[var(--color-leo-maroon)] mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

