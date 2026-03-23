import { Context } from "@netlify/functions";
import { GoogleAuth } from "google-auth-library";

/**
 * GA4 Analytics Reporting Function
 * Netlify Function proxy to fetch live data from GA4 Data API
 */
export default async (req: Request, context: Context) => {
  try {
    // 1. Get secrets from Netlify Environment
    const propertyId = Netlify.env.get("GA4_PROPERTY_ID");
    const clientEmail = Netlify.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Netlify.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, '\n');

    // 2. Safety check for setup
    if (!propertyId || !clientEmail || !privateKey) {
      return new Response(JSON.stringify({ 
        setupNeeded: true,
        error: "Analytics connection details not configured in Netlify environment variables." 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 3. Authenticate with Google
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
        dimensions: [{ name: "pagePath" }], // To find top page
        limit: 10
      }),
    });

    const data = await response.json();

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
