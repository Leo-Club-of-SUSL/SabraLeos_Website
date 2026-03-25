import { GoogleAuth } from "google-auth-library";

/**
 * Cloudflare Pages Function for GA4 Reporting
 * Migrated from Netlify Functions (.mts)
 */

interface Env {
  GA4_PROPERTY_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    
    // 1. Get secrets from Cloudflare Environment
    const propertyId = env.GA4_PROPERTY_ID;
    const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Replace literal \n with actual newlines if stored as a single line
    const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // 2. Safety check for setup
    if (!propertyId || !clientEmail || !privateKey) {
      return new Response(JSON.stringify({ 
        setupNeeded: true,
        error: "Analytics connection details not configured in Cloudflare environment variables." 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 3. Authenticate with Google
    // GoogleAuth works in Cloudflare Workers environment with nodejs_compat flag
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: "https://www.googleapis.com/auth/analytics.readonly",
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // 4. Request the report (Last 30 days)
    const reportUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const response = await fetch(reportUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "activeUsers" }
        ],
        dimensions: [{ name: "pagePath" }],
        limit: 10
      }),
    });

    const data: any = await response.json();

    if (data.error) {
       console.error("GA Data API returned error:", data.error);
       throw new Error(data.error.message || "GA Data API Communication Error");
    }

    // 5. Package results for frontend
    const totalUsers = data.rows?.[0]?.metricValues?.[0]?.value || "0";
    const pageViews = data.rows?.[0]?.metricValues?.[1]?.value || "0";
    const activeUsers = data.rows?.[0]?.metricValues?.[2]?.value || "0";
    const topPage = data.rows?.[0]?.dimensionValues?.[0]?.value || "/";

    return new Response(JSON.stringify({
      totalUsers,
      pageViews,
      activeUsers,
      topPage,
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Critical Analytics Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Analytics Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
