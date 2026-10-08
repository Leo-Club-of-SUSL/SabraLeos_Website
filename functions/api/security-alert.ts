/**
 * Cloudflare Pages Function — Security Alert Email Dispatch
 * Route: POST /api/security-alert
 */

interface Env {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const ALLOWED_ORIGINS = [
  "https://sabraleos.org",
  "https://www.sabraleos.org",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".sabraleos-website.pages.dev") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { headers: getCorsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const payload = await request.json() as {
      to?: string;
      eventType?: string;
      attemptedEmail?: string | null;
      details?: string;
      timestamp?: string;
      userAgent?: string;
      resendApiKey?: string;
    };

    const to = payload.to;
    if (!to) {
      return new Response(
        JSON.stringify({ error: "Missing recipient email ('to')" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const resendApiKey = payload.resendApiKey || env.RESEND_API_KEY || (env as any).VITE_RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Resend API key is not configured. Please add your Resend API Key in Admin Dashboard -> Security.",
          code: "MISSING_RESEND_KEY" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const eventLabels: Record<string, string> = {
      brute_force_detected: "🚨 Brute Force Attack Detected",
      account_locked: "🔒 Account Locked",
      login_failed: "⚠️ Failed Login Attempt",
      test_alert: "🧪 Security Alert Test",
    };

    const eventType = payload.eventType || "brute_force_detected";
    const subject = eventLabels[eventType] || `Security Alert: ${eventType}`;
    const timestamp = payload.timestamp || new Date().toISOString();
    const formattedTime = new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
    });

    const isCritical = eventType.includes("brute") || eventType.includes("locked");
    const bannerBg = isCritical ? "#fef2f2" : "#fffbeb";
    const bannerBorder = isCritical ? "#fecaca" : "#fde68a";

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

    const fromEmail = env.RESEND_FROM_EMAIL || "Leo Club Security <onboarding@resend.dev>";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey.trim()}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to.trim()],
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json() as any;

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ 
          error: resendData.message || resendData.error || "Failed to send email via Resend",
          details: resendData 
        }),
        { status: resendRes.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("security-alert function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
};
