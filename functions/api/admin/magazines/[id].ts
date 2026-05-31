/**
 * Cloudflare Pages Function — Admin Magazine Update + Delete
 *
 * Routes:
 *   PATCH  /api/admin/magazines/[id] — partial update
 *   DELETE /api/admin/magazines/[id] — delete record + storage files
 *
 * All requests require valid Supabase JWT.
 */

interface Env {
  SUPABASE_URL: string;
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
    "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
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

async function deleteStorageFile(
  supabaseUrl: string,
  serviceKey: string,
  bucket: string,
  path: string
): Promise<void> {
  if (!path) return;
  try {
    await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
  } catch (err) {
    // Fail gracefully — file may not exist
    console.warn(`Storage delete failed for ${bucket}/${path}:`, err);
  }
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  const id = params.id as string;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json(
      { error: "Invalid magazine ID" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
    }

    // Validate slug if being updated
    if (body.slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return Response.json(
          { error: "slug must match ^[a-z0-9-]+$" },
          { status: 400, headers: corsHeaders }
        );
      }
      // Check slug uniqueness (excluding this record)
      const slugCheckRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/magazines?slug=eq.${encodeURIComponent(body.slug)}&id=neq.${id}&select=id&limit=1`,
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
    }

    // Validate volume/issue numbers
    if (
      body.volume_number !== undefined &&
      body.volume_number !== null &&
      (!Number.isInteger(body.volume_number) || body.volume_number < 1)
    ) {
      return Response.json(
        { error: "volume_number must be a positive integer" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (
      body.issue_number !== undefined &&
      body.issue_number !== null &&
      (!Number.isInteger(body.issue_number) || body.issue_number < 1)
    ) {
      return Response.json(
        { error: "issue_number must be a positive integer" },
        { status: 400, headers: corsHeaders }
      );
    }

    const updateRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(body),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      if (errText.includes("unique") || errText.includes("duplicate")) {
        return Response.json(
          { error: "Slug already exists", field: "slug" },
          { status: 409, headers: corsHeaders }
        );
      }
      return Response.json(
        { error: "Update failed" },
        { status: 502, headers: corsHeaders }
      );
    }

    const updated: any[] = await updateRes.json();
    return Response.json(updated[0] ?? { ok: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Magazine update error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  const id = params.id as string;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json(
      { error: "Invalid magazine ID" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Fetch the magazine first to get storage paths
    const magRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?id=eq.${encodeURIComponent(id)}&select=cover_image_path,pdf_file_path&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const magazines: any[] = await magRes.json();
    const magazine = magazines[0];

    if (!magazine) {
      return Response.json({ error: "Not Found" }, { status: 404, headers: corsHeaders });
    }

    // Delete storage files (fail gracefully)
    await Promise.all([
      deleteStorageFile(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        "magazine-covers",
        magazine.cover_image_path
      ),
      deleteStorageFile(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        "magazine-pdfs",
        magazine.pdf_file_path
      ),
    ]);

    // Delete DB record
    const deleteRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/magazines?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!deleteRes.ok) {
      return Response.json(
        { error: "Delete failed" },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Magazine delete error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
