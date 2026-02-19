// Supabase Edge Function: security-alert
// Sends email alerts via Resend when suspicious activity is detected.
//
// Deploy with:
//   supabase functions deploy security-alert
//
// Required secret:
//   supabase secrets set RESEND_API_KEY=re_xxxxx

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface AlertPayload {
    to: string;
    eventType: string;
    attemptedEmail: string | null;
    details: string;
    timestamp: string;
    userAgent: string;
}

const eventLabels: Record<string, string> = {
    brute_force_detected: "🚨 Brute Force Attack Detected",
    account_locked: "🔒 Account Locked",
    login_failed: "⚠️ Failed Login Attempt",
    login_success: "✅ Successful Login",
};

serve(async (req: Request) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ error: "RESEND_API_KEY not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const payload: AlertPayload = await req.json();

        if (!payload.to) {
            return new Response(
                JSON.stringify({ error: "No recipient email provided" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const subject = eventLabels[payload.eventType] || `Security Alert: ${payload.eventType}`;
        const formattedTime = new Date(payload.timestamp).toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "medium",
        });

        const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: #7B1113; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #FDBE15; margin: 0; font-size: 24px;">🛡️ Leo Club Security Alert</h1>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background: ${payload.eventType.includes('brute') || payload.eventType.includes('locked') ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${payload.eventType.includes('brute') || payload.eventType.includes('locked') ? '#fecaca' : '#fde68a'}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${subject}</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${formattedTime}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Event Type</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${payload.eventType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email Attempted</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace;">${payload.attemptedEmail || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Details</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${payload.details || 'No additional details'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Browser</td>
              <td style="padding: 8px 0; color: #6b7280; font-size: 12px; word-break: break-all;">${payload.userAgent || 'Unknown'}</td>
            </tr>
          </table>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            This is an automated security alert from your Leo Club website admin panel.
            <br>If you did not trigger this, please investigate immediately.
          </p>
        </div>
      </div>
    `;

        // Send via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Leo Club Security <onboarding@resend.dev>",
                to: [payload.to],
                subject,
                html: htmlBody,
            }),
        });

        const result = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error("Resend API error:", result);
            return new Response(
                JSON.stringify({ error: "Failed to send email", details: result }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: result.id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Edge Function error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
