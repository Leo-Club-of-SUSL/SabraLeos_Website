// Cloudflare Pages: Vite builds to dist/, Pages handles routing + Functions automatically
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function securityAlertDevPlugin() {
  return {
    name: 'security-alert-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/security-alert' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const to = payload.to;
              const apiKey = payload.resendApiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

              if (!to) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Missing recipient email ('to')" }));
                return;
              }

              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  error: 'Resend API key is not configured. Please add your Resend API Key in Admin Dashboard -> Security.',
                  code: 'MISSING_RESEND_KEY' 
                }));
                return;
              }

              const eventLabels: Record<string, string> = {
                brute_force_detected: '🚨 Brute Force Attack Detected',
                account_locked: '🔒 Account Locked',
                login_failed: '⚠️ Failed Login Attempt',
                test_alert: '🧪 Security Alert Test',
              };

              const eventType = payload.eventType || 'brute_force_detected';
              const subject = eventLabels[eventType] || `Security Alert: ${eventType}`;
              const timestamp = payload.timestamp || new Date().toISOString();
              const formattedTime = new Date(timestamp).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'medium',
              });

              const isCritical = eventType.includes('brute') || eventType.includes('locked');
              const bannerBg = isCritical ? '#fef2f2' : '#fffbeb';
              const bannerBorder = isCritical ? '#fecaca' : '#fde68a';

              const htmlBody = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
                  <div style="background: #7B1113; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: #FDBE15; margin: 0; font-size: 24px;">🛡️ Leo Club Security Alert</h1>
                  </div>
                  <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    <div style="background: ${bannerBg}; border: 1px solid ${bannerBorder}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                      <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${subject}</h2>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">${formattedTime}</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Event Type</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${eventType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Attempted Email</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace;">${payload.attemptedEmail || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Details</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${payload.details || 'No additional details provided'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">User Agent</td>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 12px; word-break: break-all;">${payload.userAgent || 'Unknown'}</td>
                      </tr>
                    </table>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                      This is an automated security notification from your Leo Club website admin system.
                      <br>If this was not expected, please investigate immediately.
                    </p>
                  </div>
                </div>
              `;

              const fromEmail = process.env.RESEND_FROM_EMAIL || 'Leo Club Security <onboarding@resend.dev>';
              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey.trim()}`,
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: [to.trim()],
                  subject,
                  html: htmlBody,
                }),
              });

              const resendData = await resendRes.json();
              res.statusCode = resendRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(resendData));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), securityAlertDevPlugin()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
        },
      },
    },
  },
})