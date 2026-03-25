/**
 * Cloudflare Pages Function — GA4 Analytics Proxy
 *
 * Uses the Web Crypto API (crypto.subtle) to sign a JWT and exchange it for
 * a Google OAuth2 access token. No Node.js SDK dependencies required.
 *
 * Route: /api/analytics  (GET)
 */

interface Env {
  GA4_PROPERTY_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const { GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;

    if (!GA4_PROPERTY_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return Response.json(
        {
          setupNeeded: true,
          error: "Analytics environment variables are not configured in Cloudflare.",
        },
        { status: 200, headers: corsHeaders }
      );
    }

    const accessToken = await getAccessToken(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY);

    const gaResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [
            { name: "totalUsers" },
            { name: "screenPageViews" },
            { name: "activeUsers" },
          ],
          dimensions: [{ name: "pagePath" }],
          limit: 10,
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        }),
      }
    );

    const data: any = await gaResponse.json();

    if (data.error) {
      console.error("GA Data API error:", data.error);
      throw new Error(data.error.message || "GA Data API error");
    }

    // Aggregate totals across all returned rows
    let totalUsers = 0;
    let pageViews = 0;
    let activeUsers = 0;

    for (const row of data.rows ?? []) {
      totalUsers  += Number(row.metricValues?.[0]?.value ?? 0);
      pageViews   += Number(row.metricValues?.[1]?.value ?? 0);
      activeUsers += Number(row.metricValues?.[2]?.value ?? 0);
    }

    const topPage = data.rows?.[0]?.dimensionValues?.[0]?.value ?? "/";

    return Response.json(
      {
        totalUsers: String(totalUsers),
        pageViews: String(pageViews),
        activeUsers: String(activeUsers),
        topPage,
        lastUpdated: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Analytics proxy error:", err);
    return Response.json(
      { error: err.message ?? "Internal analytics error" },
      { status: 500, headers: corsHeaders }
    );
  }
};

// ---------------------------------------------------------------------------
// Google OAuth2 helpers — Web Crypto API only, no external packages
// ---------------------------------------------------------------------------

/**
 * Builds and signs a JWT, then exchanges it for a short-lived OAuth2 access token.
 */
async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss:   email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud:   "https://oauth2.googleapis.com/token",
      exp:   now + 3600,
      iat:   now,
    })
  );

  const signingInput = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureData = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signature = base64urlFromBuffer(new Uint8Array(signatureData));
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData: any = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error(`Failed to obtain access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

/** Base64url-encode a plain string. */
function base64url(str: string): string {
  return base64urlFromBuffer(new TextEncoder().encode(str));
}

/** Base64url-encode a Uint8Array. */
function base64urlFromBuffer(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Strips PEM headers/footers and decodes the Base64 body to an ArrayBuffer.
 * Handles both PKCS8 ("PRIVATE KEY") and PKCS1 ("RSA PRIVATE KEY") PEM blocks,
 * as well as Cloudflare env var encoding quirks (literal \n, \r\n line endings, etc.).
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  let input = pem.trim();

  // 1. Handle case where user might have pasted the entire Service Account JSON
  if (input.startsWith('{')) {
    try {
      const json = JSON.parse(input);
      if (json.private_key) {
        input = json.private_key;
      }
    } catch (e) {
      // Not valid JSON, continue with original string
    }
  }

  // 2. Remove surrounding quotes if present (common if set via CLI or certain dashboards)
  if ((input.startsWith('"') && input.endsWith('"')) || (input.startsWith("'") && input.endsWith("'"))) {
    input = input.slice(1, -1);
  }

  // 3. Replace literal backslash-n sequences (Cloudflare stores newlines this way)
  let cleanPem = input.replace(/\\n/g, '\n');

  // 4. Strip PEM header and footer lines
  cleanPem = cleanPem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '');

  // 5. Remove ALL whitespace and line endings
  const base64 = cleanPem
    .replace(/\s/g, '')
    .trim();

  // 6. Final validation and decoding
  try {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  } catch (err: any) {
    // If atob still fails, provide a very descriptive error for the user
    const invalidChars = base64.replace(/[A-Za-z0-9+/=]/g, '');
    const charSummary = invalidChars.length > 0 
      ? `Contains invalid chars: "${invalidChars.slice(0, 10)}"` 
      : "Length might not be multiple of 4 or contains hidden chars";
      
    throw new Error(
      `Failed to decode GOOGLE_PRIVATE_KEY base64. ${charSummary}. ` +
      `Ensure you copied the PRIVATE KEY part (including BEGIN/END lines) correctly. ` +
      `Error: ${err.message}`
    );
  }
}
