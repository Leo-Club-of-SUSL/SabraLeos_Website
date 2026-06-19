/**
 * Cloudflare Pages Function — Cloudinary Orphaned Files Audit
 *
 * Routes:
 *   GET /api/admin/cloudinary-audit  — Lists all orphaned files in Cloudinary
 *
 * All requests require a valid Supabase JWT.
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
  methods = "GET, OPTIONS"
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

// Re-implemented helper directly in backend endpoint file to avoid bundle/import complications
function isCloudinaryUrl(url: string): boolean {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function extractCloudinaryPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  const uploadToken = "/image/upload/";
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) return null;

  let remainingPath = url.substring(uploadIndex + uploadToken.length);
  remainingPath = remainingPath.split("?")[0].split("#")[0];

  const segments = remainingPath.split("/");
  const knownTransformationKeys = [
    "w", "h", "c", "q", "f", "e", "r", "b", "bo", "co", "bg", "a", "o", "x", "y", "z", "dpr", "fl", "l", "u", "pg", "dl", "p", "g"
  ];

  let startIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (/^v\d+$/.test(seg)) {
      startIndex = i + 1;
      break;
    }
    
    const isTrans = seg.split(",").every(part => {
      const underscoreIndex = part.indexOf("_");
      if (underscoreIndex === -1 || underscoreIndex > 3) return false;
      const key = part.substring(0, underscoreIndex);
      return knownTransformationKeys.includes(key);
    });

    if (isTrans) {
      startIndex = i + 1;
    }
  }

  const publicIdSegments = segments.slice(startIndex);
  if (publicIdSegments.length === 0) return null;

  const lastSegment = publicIdSegments[publicIdSegments.length - 1];
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex !== -1) {
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.substring(0, dotIndex);
  }

  return publicIdSegments.join("/");
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // 1. Auth check
  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return Response.json(
        { error: "Server Configuration Error — Cloudinary credentials missing" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 2. Fetch active URLs from Supabase DB
    const dbHeaders = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    const [galleryRes, awardsRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/gallery?select=image_url`, { headers: dbHeaders }),
      fetch(`${env.SUPABASE_URL}/rest/v1/awards?select=image_url,thumbnail_url`, { headers: dbHeaders }),
    ]);

    if (!galleryRes.ok) {
      throw new Error(`Failed to fetch gallery from Supabase: ${galleryRes.statusText}`);
    }
    if (!awardsRes.ok) {
      throw new Error(`Failed to fetch awards from Supabase: ${awardsRes.statusText}`);
    }

    const galleryData: any[] = await galleryRes.json();
    const awardsData: any[] = await awardsRes.json();

    const dbPublicIds = new Set<string>();

    // Process Gallery images
    galleryData.forEach((row) => {
      if (row.image_url) {
        const pid = extractCloudinaryPublicId(row.image_url);
        if (pid) dbPublicIds.add(pid);
      }
    });

    // Process Awards images and thumbnails
    awardsData.forEach((row) => {
      if (row.image_url) {
        const pid = extractCloudinaryPublicId(row.image_url);
        if (pid) dbPublicIds.add(pid);
      }
      if (row.thumbnail_url) {
        const pid = extractCloudinaryPublicId(row.thumbnail_url);
        if (pid) dbPublicIds.add(pid);
      }
    });

    // 3. Fetch all images from Cloudinary (Paginated)
    const allCloudinaryPublicIds: string[] = [];
    let nextCursor: string | null = null;
    const authString = btoa(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`);

    do {
      const url = new URL(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image`);
      url.searchParams.set("max_results", "500");
      if (nextCursor) {
        url.searchParams.set("next_cursor", nextCursor);
      }

      const cloudinaryRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      if (!cloudinaryRes.ok) {
        throw new Error(`Cloudinary Admin API listing failed: ${cloudinaryRes.status} ${await cloudinaryRes.text()}`);
      }

      const result: any = await cloudinaryRes.json();
      if (result.resources) {
        result.resources.forEach((r: any) => {
          allCloudinaryPublicIds.push(r.public_id);
        });
      }
      nextCursor = result.next_cursor || null;
    } while (nextCursor);

    // 4. Compare sets: Cloudinary resources NOT in DB
    // We only audit resources in the 'leo-club' folder to avoid picking up unrelated assets if any exist
    const orphanedPublicIds = allCloudinaryPublicIds.filter((pid) => {
      // Must be in the 'leo-club' folder (standard for this project)
      const isInFolder = pid.startsWith("leo-club/");
      return isInFolder && !dbPublicIds.has(pid);
    });

    return Response.json(
      {
        orphaned_public_ids: orphanedPublicIds,
        total_in_cloudinary: allCloudinaryPublicIds.filter(pid => pid.startsWith("leo-club/")).length,
        total_in_db: dbPublicIds.size,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Cloudinary audit handler error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
