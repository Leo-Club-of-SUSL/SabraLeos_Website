/**
 * Cloudflare Pages Function — Secure PDF Proxy
 *
 * Route: GET /api/magazines/[id]/pdf
 * Route: GET /api/magazines/[id]/pdf?download=true
 *
 * Security:
 * 1. Fetch magazine record (service role key) — 404 if not found
 * 2. Reject if not published — 403
 * 3. Reject download if not downloadable — 403
 * 4. Generate signed URL (60s expiry) for private magazine-pdfs bucket
 * 5. Server-side fetch PDF bytes from signed URL
 * 6. Validate %PDF magic bytes — 422 if invalid
 * 7. Stream response with security headers
 * 8. In-memory rate limiting: 30 req / IP / minute
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (per isolate — best effort without KV)
// ---------------------------------------------------------------------------
interface RateEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateEntry>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// Periodically clean up expired entries (run on each request)
function pruneRateLimitMap() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;

  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Cache-Control": "private, no-store",
  };

  // ── Rate limiting ──
  pruneRateLimitMap();
  const clientIp =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Too Many Requests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter ?? 60),
          ...securityHeaders,
        },
      }
    );
  }

  const id = params.id as string;

  // ── Validate ID format ──
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  const url = new URL(request.url);
  const isDownload = url.searchParams.get("download") === "true";

  // ── 1. Fetch magazine record ──
  const magRes = await fetch(
    `${SUPABASE_URL}/rest/v1/magazines?id=eq.${encodeURIComponent(id)}&select=id,slug,is_published,is_downloadable,pdf_file_path&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!magRes.ok) {
    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  const magazines: any[] = await magRes.json();
  const magazine = magazines[0];

  // ── 2. Not found ──
  if (!magazine) {
    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // ── 3. Published check ──
  if (!magazine.is_published) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // ── 4. Download check ──
  if (isDownload && !magazine.is_downloadable) {
    return new Response(
      JSON.stringify({ error: "Forbidden — download is disabled for this magazine" }),
      { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  const pdfPath = magazine.pdf_file_path;

  if (!pdfPath) {
    return new Response(
      JSON.stringify({ error: "PDF not available" }),
      { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // ── 5. Generate signed URL (60 second expiry) ──
  const signedUrlRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/magazine-pdfs/${encodeURIComponent(pdfPath)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 }),
    }
  );

  if (!signedUrlRes.ok) {
    console.error("Failed to generate signed URL:", await signedUrlRes.text());
    return new Response(
      JSON.stringify({ error: "Could not access PDF" }),
      { status: 502, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  const { signedURL } = await signedUrlRes.json() as { signedURL: string };

  // ── 6. Fetch PDF bytes server-side ──
  const pdfRes = await fetch(`${SUPABASE_URL}/storage/v1${signedURL}`);

  if (!pdfRes.ok) {
    return new Response(
      JSON.stringify({ error: "PDF unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // ── 7. Validate %PDF magic bytes ──
  const pdfBuffer = await pdfRes.arrayBuffer();
  const firstBytes = new Uint8Array(pdfBuffer.slice(0, 4));
  const magic = String.fromCharCode(...firstBytes);

  if (magic !== "%PDF") {
    return new Response(
      JSON.stringify({ error: "Unprocessable Entity — file is not a valid PDF" }),
      { status: 422, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // ── 8. Stream response with security headers ──
  const slug = magazine.slug || id;
  const disposition = isDownload
    ? `attachment; filename="${slug}.pdf"`
    : `inline; filename="${slug}.pdf"`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Content-Length": String(pdfBuffer.byteLength),
      ...securityHeaders,
    },
  });
};
