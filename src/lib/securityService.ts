import { supabase } from './supabase';

// ============================================
// Types
// ============================================

export type SecurityEventType =
    | 'login_success'
    | 'login_failed'
    | 'account_locked'
    | 'brute_force_detected'
    | 'logout';

export interface SecurityLog {
    id: number;
    event_type: SecurityEventType;
    email: string | null;
    ip_address: string | null;
    user_agent: string | null;
    details: string | null;
    created_at: string;
}

// ============================================
// Constants
// ============================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// ============================================
// Utility — Client Info
// ============================================

const getClientInfo = () => ({
    user_agent: navigator.userAgent,
    // IP will be best-effort; for true IP tracking you'd use a server-side function
    ip_address: null as string | null,
});

// ============================================
// Security Event Logging
// ============================================

export const securityService = {
    /**
     * Log a security event to the database
     */
    async logEvent(
        eventType: SecurityEventType,
        email: string | null,
        details?: string
    ): Promise<void> {
        const clientInfo = getClientInfo();

        try {
            await supabase.from('security_logs').insert([
                {
                    event_type: eventType,
                    email,
                    ip_address: clientInfo.ip_address,
                    user_agent: clientInfo.user_agent,
                    details: details || null,
                },
            ]);
        } catch (err) {
            console.error('Failed to log security event:', err);
        }
    },

    /**
     * Check if an email has been locked out due to brute force attempts.
     * Returns { locked: boolean, remainingMinutes: number, failedCount: number }
     */
    async checkBruteForce(email: string): Promise<{
        locked: boolean;
        remainingMinutes: number;
        failedCount: number;
    }> {
        const windowStart = new Date(
            Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000
        ).toISOString();

        try {
            // Count failed attempts in the lockout window
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .eq('email', email)
                .eq('event_type', 'login_failed')
                .gte('created_at', windowStart)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const failedCount = data?.length || 0;

            if (failedCount >= MAX_FAILED_ATTEMPTS) {
                // Find when the lockout expires (oldest failed attempt in window + lockout duration)
                const oldestAttempt = data![data!.length - 1];
                const lockoutEnd = new Date(
                    new Date(oldestAttempt.created_at).getTime() +
                    LOCKOUT_DURATION_MINUTES * 60 * 1000
                );
                const remainingMs = lockoutEnd.getTime() - Date.now();
                const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));

                return { locked: true, remainingMinutes, failedCount };
            }

            return { locked: false, remainingMinutes: 0, failedCount };
        } catch (err) {
            console.error('Error checking brute force:', err);
            // Fail-open: don't lock out if we can't check (prevents DoS on the check itself)
            return { locked: false, remainingMinutes: 0, failedCount: 0 };
        }
    },

    /**
     * Fetch recent security logs (authenticated users only)
     */
    async getRecentLogs(limit = 50): Promise<SecurityLog[]> {
        try {
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as SecurityLog[];
        } catch (err) {
            console.error('Error fetching security logs:', err);
            return [];
        }
    },

    /**
     * Trigger a security alert email via Supabase Edge Function.
     * Fails silently if Edge Function is not deployed or alert email is not set.
     */
    async triggerSecurityAlert(
        eventType: SecurityEventType,
        email: string | null,
        details?: string
    ): Promise<void> {
        try {
            // Read the alert email from site_content
            const { data: contentData } = await supabase
                .from('site_content')
                .select('value')
                .eq('key', 'alert_email')
                .single();

            const alertEmail = contentData?.value;
            if (!alertEmail) {
                console.warn('No alert email configured. Skipping security alert.');
                return;
            }

            // Call the Edge Function
            const { error } = await supabase.functions.invoke('security-alert', {
                body: {
                    to: alertEmail,
                    eventType,
                    attemptedEmail: email,
                    details: details || '',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                },
            });

            if (error) {
                console.warn('Security alert Edge Function failed (may not be deployed):', error.message);
            }
        } catch (err) {
            // Fail silently — email alerts are optional
            console.warn('Could not send security alert:', err);
        }
    },

    /**
     * Clear old security logs (older than 30 days)
     */
    async clearOldLogs(): Promise<void> {
        const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        try {
            await supabase
                .from('security_logs')
                .delete()
                .lt('created_at', thirtyDaysAgo);
        } catch (err) {
            console.error('Error clearing old logs:', err);
        }
    },
};
