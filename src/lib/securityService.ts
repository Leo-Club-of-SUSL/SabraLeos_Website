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
                .select('id, created_at')
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
    async getRecentLogs(limit?: number): Promise<SecurityLog[]> {
        try {
            let query = supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (limit && limit > 0) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []) as SecurityLog[];
        } catch (err) {
            console.error('Error fetching security logs:', err);
            return [];
        }
    },

    /**
     * Trigger a security alert email via /api/security-alert or Resend.
     * Returns { success: boolean, message?: string }.
     */
    async triggerSecurityAlert(
        eventType: SecurityEventType | 'test_alert',
        email: string | null,
        details?: string,
        throwOnError: boolean = false
    ): Promise<{ success: boolean; message?: string }> {
        try {
            // Read the alert email and optional resend api key from site_content
            const { data: contentData } = await supabase
                .from('site_content')
                .select('key, value')
                .in('key', ['alert_email', 'resend_api_key']);

            const contentMap: Record<string, string> = {};
            (contentData || []).forEach(row => {
                contentMap[row.key] = row.value;
            });

            const alertEmail = contentMap['alert_email'];
            const resendApiKey = contentMap['resend_api_key'] || import.meta.env.VITE_RESEND_API_KEY;

            if (!alertEmail) {
                const msg = 'No alert email configured in settings. Skipping security alert.';
                console.warn(msg);
                if (throwOnError) throw new Error(msg);
                return { success: false, message: msg };
            }

            const payload = {
                to: alertEmail,
                eventType,
                attemptedEmail: email,
                details: details || '',
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                resendApiKey: resendApiKey || undefined,
            };

            // Attempt 1: Call Cloudflare Pages / Vite server endpoint /api/security-alert
            try {
                const res = await fetch('/api/security-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    return { success: true, message: `Alert email sent to ${alertEmail}` };
                }

                const errJson = await res.json().catch(() => ({}));
                if (errJson?.error) {
                    if (throwOnError) throw new Error(errJson.error);
                    console.warn('/api/security-alert error:', errJson.error);
                }
            } catch (fetchErr: any) {
                console.warn('Call to /api/security-alert failed:', fetchErr.message);
                if (throwOnError && !resendApiKey) throw fetchErr;
            }

            // Attempt 2: If resendApiKey is available, dispatch directly to Resend API
            if (resendApiKey) {
                try {
                    const eventLabels: Record<string, string> = {
                        brute_force_detected: '🚨 Brute Force Attack Detected',
                        account_locked: '🔒 Account Locked',
                        login_failed: '⚠️ Failed Login Attempt',
                        test_alert: '🧪 Security Alert Test',
                    };
                    const subject = eventLabels[eventType] || `Security Alert: ${eventType}`;
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${resendApiKey.trim()}`,
                        },
                        body: JSON.stringify({
                            from: 'Leo Club Security <onboarding@resend.dev>',
                            to: [alertEmail.trim()],
                            subject,
                            html: `
                              <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
                                <div style="background: #7B1113; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #FDBE15;">
                                  <h2 style="margin: 0;">🛡️ Leo Club Security Alert</h2>
                                </div>
                                <div style="padding: 24px; background: white;">
                                  <h3 style="color: #1f2937;">${subject}</h3>
                                  <p><strong>Attempted Email:</strong> ${email || 'N/A'}</p>
                                  <p><strong>Details:</strong> ${details || 'No details provided'}</p>
                                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                                </div>
                              </div>
                            `,
                        }),
                    });

                    const resData = await res.json().catch(() => ({}));
                    if (res.ok) {
                        return { success: true, message: `Alert email sent to ${alertEmail}` };
                    }
                    if (throwOnError) throw new Error(resData.message || resData.error || 'Resend API returned an error');
                } catch (directErr: any) {
                    console.warn('Direct Resend dispatch error:', directErr);
                    if (throwOnError) throw directErr;
                }
            }

            // Attempt 3: Supabase Edge function invocation
            try {
                const { error: sbError } = await supabase.functions.invoke('security-alert', { body: payload });
                if (!sbError) {
                    return { success: true, message: `Alert email dispatched to ${alertEmail}` };
                }
            } catch {}

            const finalMsg = 'Resend API Key is required to deliver alert emails. Please configure RESEND_API_KEY in Security Settings.';
            if (throwOnError) throw new Error(finalMsg);
            return { success: false, message: finalMsg };
        } catch (err: any) {
            console.warn('Could not send security alert:', err);
            if (throwOnError) throw err;
            return { success: false, message: err?.message || 'Failed to send alert email' };
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
