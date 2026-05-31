/**
 * Cloudflare Pages Function — Admin Magazine List + Create
 *
 * Routes:
 *   GET  /api/admin/magazines  — paginated list of ALL magazines (published + draft)
 *   POST /api/admin/magazines  — create new magazine record
 *
 * All requests require valid Supabase JWT (Bearer token in Authorization header).
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const ALLOWED_ORIGINS = [
  "https://sabraleos.org",
  "https://www.sabraleos.org",
];

function getCorsHeaders(
  origin: string | null,
  methods = "GET, POST, OPTIONS"
): Record<string, string> {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".sabraleos-website.pages.dev"));
  return {
    "Access-Control-Allow-Origin": allowed
      ? origin!
      : "https://sabraleos.org",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  };
}

async function verifyAdmin(
  request: Request,
  env: Env
): Promise<{ ok: true; userEmail: string } | { ok: false; status: number; error: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized — missing token" };
  }

  const token = authHeader.slice(7);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    return { ok: false, status: 401, error: "Unauthorized — invalid or expired token" };
  }

  const user: any = await userRes.json();
  if (!user?.email) {
    return { ok: false, status: 401, error: "Unauthorized — invalid token" };
  }

  return { ok: true, userEmail: user.email };
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin, "GET, POST, OPTIONS"),
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, "GET, POST, OPTIONS");

  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    // Fetch count
    const countRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?select=id`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "count=exact",
          Range: "0-0",
        },
      }
    );
    const contentRange = countRes.headers.get("Content-Range") || "0-0/0";
    const total = parseInt(contentRange.split("/")[1] || "0", 10);

    // Fetch data (all fields including admin-only fields)
    const dataRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!dataRes.ok) {
      throw new Error(await dataRes.text());
    }

    const data: any[] = await dataRes.json();

    // Resolve cover_url for admin convenience
    const enriched = data.map((mag) => ({
      ...mag,
      cover_url: mag.cover_image_path
        ? `${env.SUPABASE_URL}/storage/v1/object/public/magazine-covers/${mag.cover_image_path}`
        : null,
    }));

    return Response.json(
      { data: enriched, total, page, totalPages: Math.ceil(total / limit) },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Admin magazine list error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, "GET, POST, OPTIONS");

  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      title,
      slug,
      volume_number,
      issue_number,
      published_date,
      description,
      cover_image_path,
      pdf_file_path,
      is_published,
      is_downloadable,
      tags,
    } = body;

    // ── Validation ──
    if (!title || typeof title !== "string" || !title.trim()) {
      return Response.json(
        { error: "title is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!slug || typeof slug !== "string") {
      return Response.json(
        { error: "slug is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return Response.json(
        { error: "slug must match ^[a-z0-9-]+$" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!pdf_file_path || typeof pdf_file_path !== "string") {
      return Response.json(
        { error: "pdf_file_path is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      volume_number !== undefined &&
      volume_number !== null &&
      (!Number.isInteger(volume_number) || volume_number < 1)
    ) {
      return Response.json(
        { error: "volume_number must be a positive integer" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      issue_number !== undefined &&
      issue_number !== null &&
      (!Number.isInteger(issue_number) || issue_number < 1)
    ) {
      return Response.json(
        { error: "issue_number must be a positive integer" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Slug uniqueness check ──
    const slugCheckRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const existing: any[] = await slugCheckRes.json();
    if (existing.length > 0) {
      return Response.json(
        { error: "Slug already exists", field: "slug" },
        { status: 409, headers: corsHeaders }
      );
    }

    // ── Insert ──
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/magazines`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim(),
        volume_number: volume_number ?? null,
        issue_number: issue_number ?? null,
        published_date: published_date || null,
        description: description || null,
        cover_image_path: cover_image_path || null,
        pdf_file_path,
        is_published: is_published ?? false,
        is_downloadable: is_downloadable ?? true,
        tags: tags || null,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Magazine insert error:", errText);
      // Check for unique constraint violation
      if (errText.includes("unique") || errText.includes("duplicate")) {
        return Response.json(
          { error: "Slug already exists", field: "slug" },
          { status: 409, headers: corsHeaders }
        );
      }
      return Response.json(
        { error: "Failed to create magazine" },
        { status: 502, headers: corsHeaders }
      );
    }

    const created: any[] = await insertRes.json();
    return Response.json(created[0], { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error("Admin magazine create error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
