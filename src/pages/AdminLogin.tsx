import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, AlertTriangle, Loader2, ShieldAlert, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signIn, isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(result.error || 'Login failed');

        if (result.locked) {
          setIsLocked(true);
          setLockoutMinutes(result.remainingMinutes || 15);
        }

        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 size={32} className="animate-spin text-[var(--color-leo-maroon)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 hover:text-[var(--color-leo-maroon)] mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLocked ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[var(--color-leo-maroon)]/10'}`}>
            {isLocked ? (
              <ShieldAlert className="text-red-600 dark:text-red-400" size={32} />
            ) : (
              <Lock className="text-[var(--color-leo-maroon)]" size={32} />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isLocked ? 'Account Locked' : 'Admin Login'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isLocked ? 'Too many failed attempts' : 'Sign in to manage club data'}
          </p>
        </div>

        {/* Lockout Banner */}
        {isLocked && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-800 dark:text-red-300 font-bold text-sm">Account temporarily locked</p>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  Please wait {lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''} before trying again.
                  The admin has been notified of this activity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLocked && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < attemptsLeft ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setIsLocked(false); }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all"
              placeholder="admin@leoclub.com"
              required
              disabled={isLocked || submitting}
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all"
              placeholder="••••••••"
              required
              disabled={isLocked || submitting}
            />
          </div>
          <button
            type="submit"
            disabled={isLocked || submitting}
            className="w-full bg-[var(--color-leo-maroon)] text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing In...
              </>
            ) : isLocked ? (
              <>
                <ShieldAlert size={18} />
                Account Locked
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Protected by brute-force detection. Suspicious activity is logged and reported.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
