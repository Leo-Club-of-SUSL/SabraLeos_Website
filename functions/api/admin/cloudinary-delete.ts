/**
 * Cloudflare Pages Function — Secure Cloudinary Delete
 *
 * Routes:
 *   POST /api/admin/cloudinary-delete  — Deletes one or more images from Cloudinary
 *
 * Requirements:
 *   - Bearer JWT verification against Supabase user endpoint
 *   - Input validation (max 100 items, path traversal safety, pattern matching)
 *   - Signed Destroy API for single deletion, Admin API bulk delete for batches
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

const ALLOWED_ORIGINS = [
  "https://sabraleos.org",
  "https://www.sabraleos.org",
];

function getCorsHeaders(
  origin: string | null,
  methods = "POST, OPTIONS"
): Record<string, string> {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".sabraleos-website.pages.dev") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "https://sabraleos.org",
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

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // 1. Auth check
  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    // Check credentials exist
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary credentials missing in environment variables.");
      return Response.json(
        { error: "Server Configuration Error — Cloudinary credentials missing" },
        { status: 500, headers: corsHeaders }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { public_ids } = body;

    // 2. Input validation
    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return Response.json(
        { error: "public_ids must be a non-empty array" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (public_ids.length > 100) {
      return Response.json(
        { error: "Cannot delete more than 100 items per request" },
        { status: 400, headers: corsHeaders }
      );
    }

    const idPattern = /^[a-zA-Z0-9_\-\/\.]+$/;
    for (const id of public_ids) {
      if (typeof id !== "string") {
        return Response.json(
          { error: "Each public_id must be a string" },
          { status: 400, headers: corsHeaders }
        );
      }
      if (!idPattern.test(id)) {
        return Response.json(
          { error: `Invalid characters in public_id: "${id}"` },
          { status: 400, headers: corsHeaders }
        );
      }
      if (id.includes("..")) {
        return Response.json(
          { error: `Path traversal detected in public_id: "${id}"` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const deleted: string[] = [];
    const failed: string[] = [];

    // 3. Cloudinary API deletion
    if (public_ids.length === 1) {
      // Single deletion using Cloudinary Destroy API
      const publicId = public_ids[0];
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
      const signature = await sha1(signatureString);

      const formData = new URLSearchParams();
      formData.append("public_id", publicId);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", env.CLOUDINARY_API_KEY);
      formData.append("signature", signature);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (cloudinaryRes.ok) {
        const responseData: any = await cloudinaryRes.json();
        if (responseData.result === "ok" || responseData.result === "not_found") {
          deleted.push(publicId);
        } else {
          failed.push(publicId);
          console.warn(`Destroy failed for ID: ${publicId}. Cloudinary response:`, responseData);
        }
      } else {
        failed.push(publicId);
        console.warn(`Destroy failed for ID: ${publicId}. HTTP status: ${cloudinaryRes.status} ${await cloudinaryRes.text()}`);
      }
    } else {
      // Batch deletion using Cloudinary Admin API delete_resources
      const url = new URL(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image/upload`);
      
      // Append public_ids[] parameter for each public id
      public_ids.forEach((id) => {
        url.searchParams.append("public_ids[]", id);
      });

      const authString = btoa(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`);
      
      const cloudinaryRes = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      if (cloudinaryRes.ok) {
        const responseData: any = await cloudinaryRes.json();
        const deletedResults = responseData.deleted || {};
        
        public_ids.forEach((id) => {
          const status = deletedResults[id];
          if (status === "deleted" || status === "not_found") {
            deleted.push(id);
          } else {
            failed.push(id);
            console.warn(`Bulk delete failed for ID: ${id}. Cloudinary status: ${status}`);
          }
        });
      } else {
        public_ids.forEach((id) => failed.push(id));
        console.warn(`Bulk delete failed. HTTP status: ${cloudinaryRes.status} ${await cloudinaryRes.text()}`);
      }
    }

    return Response.json(
      { deleted, failed },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Cloudinary delete handler error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
