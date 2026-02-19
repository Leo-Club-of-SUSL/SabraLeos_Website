import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { securityService } from '../lib/securityService';

// ============================================
// Types
// ============================================

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<SignInResult>;
    signOut: () => Promise<void>;
}

interface SignInResult {
    success: boolean;
    error?: string;
    locked?: boolean;
    remainingMinutes?: number;
    attemptsLeft?: number;
}

// ============================================
// Constants
// ============================================

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ---- Session Initialization ----
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // ---- Inactivity Auto-Logout ----
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }

        if (session) {
            inactivityTimer.current = setTimeout(async () => {
                console.warn('Session expired due to inactivity.');
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [session]);

    useEffect(() => {
        if (!session) {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            return;
        }

        // Events that count as "activity"
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => resetInactivityTimer();

        activityEvents.forEach(event =>
            window.addEventListener(event, handleActivity, { passive: true })
        );

        // Start initial timer
        resetInactivityTimer();

        return () => {
            activityEvents.forEach(event =>
                window.removeEventListener(event, handleActivity)
            );
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [session, resetInactivityTimer]);

    // ---- Sign In with Brute Force Protection ----
    const signIn = async (email: string, password: string): Promise<SignInResult> => {
        try {
            // 1. Check brute force lockout
            const bruteForceCheck = await securityService.checkBruteForce(email);

            if (bruteForceCheck.locked) {
                await securityService.logEvent('account_locked', email, `Login blocked — account locked for ${bruteForceCheck.remainingMinutes} more minutes`);
                return {
                    success: false,
                    locked: true,
                    remainingMinutes: bruteForceCheck.remainingMinutes,
                    error: `Account is temporarily locked. Please try again in ${bruteForceCheck.remainingMinutes} minute(s).`,
                };
            }

            // 2. Attempt Supabase Auth sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Log failed attempt
                const failedCount = bruteForceCheck.failedCount + 1;
                await securityService.logEvent('login_failed', email, error.message);

                // Check if this failure triggers lockout
                if (failedCount >= MAX_ATTEMPTS) {
                    await securityService.logEvent('brute_force_detected', email, `${failedCount} failed attempts — account locked`);
                    // Trigger email alert
                    await securityService.triggerSecurityAlert(
                        'brute_force_detected',
                        email,
                        `${failedCount} consecutive failed login attempts detected. Account has been locked for 15 minutes.`
                    );

                    return {
                        success: false,
                        locked: true,
                        remainingMinutes: 15,
                        attemptsLeft: 0,
                        error: 'Too many failed attempts. Account locked for 15 minutes. Admin has been notified.',
                    };
                }

                return {
                    success: false,
                    attemptsLeft: MAX_ATTEMPTS - failedCount,
                    error: `Invalid credentials. ${MAX_ATTEMPTS - failedCount} attempt(s) remaining.`,
                };
            }

            // 3. Success
            setSession(data.session);
            setUser(data.user);
            await securityService.logEvent('login_success', email, 'Login successful');

            return { success: true };
        } catch (err: any) {
            console.error('Sign-in error:', err);
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    };

    // ---- Sign Out ----
    const signOut = async () => {
        const currentEmail = user?.email || null;
        await securityService.logEvent('logout', currentEmail, 'Manual sign out');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isAuthenticated: !!session,
                loading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
