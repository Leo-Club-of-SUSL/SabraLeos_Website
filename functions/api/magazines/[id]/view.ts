/**
 * Cloudflare Pages Function — View Count Increment
 *
 * Route: POST /api/magazines/[id]/view
 *
 * Fire-and-forget view count increment. Always returns 200.
 * Errors are swallowed to protect against information leakage.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const ALLOWED_ORIGINS = [
  "https://sabraleos.org",
  "https://www.sabraleos.org",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".sabraleos-website.pages.dev"));
  return {
    "Access-Control-Allow-Origin": allowed
      ? origin!
      : "https://sabraleos.org",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  };
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Always return 200 — never expose errors
  try {
    const id = params.id as string;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    // Use PATCH to increment view_count atomically
    // Supabase REST doesn't support arithmetic updates directly, so we use RPC
    // or a workaround: select then update. We'll use the rpc approach.
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/increment_magazine_view`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ magazine_id: id }),
      }
    );
  } catch {
    // Swallow all errors — fire-and-forget
  }

  return Response.json({ ok: true }, { headers: corsHeaders });
};
