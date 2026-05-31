/**
 * Cloudflare Pages Function — Public Magazine Listing
 *
 * Route: GET /api/magazines
 * Query params: ?page=1&limit=12&year=2024&tag=volume-3
 *
 * Returns published magazines only, with resolved cover_url.
 * Raw storage paths (cover_image_path, pdf_file_path) are NEVER returned.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  };
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10))
    );
    const year = url.searchParams.get("year");
    const tag = url.searchParams.get("tag");
    const offset = (page - 1) * limit;

    // Build Supabase REST query manually (no SDK in CF functions)
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return Response.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Build filter query
    let filterQuery = `is_published=eq.true`;
    if (year) {
      filterQuery += `&published_date=gte.${year}-01-01&published_date=lte.${year}-12-31`;
    }
    if (tag) {
      // PostgreSQL array contains: cs.{tag}
      filterQuery += `&tags=cs.%7B${encodeURIComponent(tag)}%7D`;
    }

    // Fetch count
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/magazines?${filterQuery}&select=id`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: "count=exact",
          Range: "0-0",
        },
      }
    );

    const contentRange = countRes.headers.get("Content-Range") || "0-0/0";
    const total = parseInt(contentRange.split("/")[1] || "0", 10);

    // Fetch data — explicitly select only safe fields (no raw storage paths)
    const dataRes = await fetch(
      `${supabaseUrl}/rest/v1/magazines?${filterQuery}&select=id,title,slug,volume_number,issue_number,published_date,description,cover_image_path,is_downloadable,tags,view_count,created_at&order=published_date.desc,created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!dataRes.ok) {
      const err = await dataRes.text();
      console.error("Supabase magazines fetch error:", err);
      return Response.json(
        { error: "Failed to fetch magazines" },
        { status: 502, headers: corsHeaders }
      );
    }

    const rawData: any[] = await dataRes.json();

    // Resolve cover_url from storage path — use public URL for covers bucket
    const data = rawData.map((mag) => {
      const { cover_image_path, ...rest } = mag;
      let cover_url: string | null = null;
      if (cover_image_path) {
        cover_url = `${supabaseUrl}/storage/v1/object/public/magazine-covers/${cover_image_path}`;
      }
      return { ...rest, cover_url };
    });

    return Response.json(
      {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Magazine listing error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
