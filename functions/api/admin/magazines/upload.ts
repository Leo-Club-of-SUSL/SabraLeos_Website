/**
 * Cloudflare Pages Function — Secure File Upload
 *
 * Route: POST /api/admin/magazines/upload
 *
 * Accepts multipart/form-data with fields:
 *   - file: the file to upload
 *   - type: "cover" | "pdf"
 *
 * Security:
 * - JWT auth verification
 * - Magic byte validation (PDF: %PDF, Image: JPEG/PNG/WebP)
 * - Filename sanitization (UUID prefix, strip special chars)
 * - Size limits enforced
 * - Returns only storage path, never full URL
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

/** Generates a UUID v4 (using Web Crypto API available in CF Workers) */
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Sanitizes filename: strip special chars, keep [a-zA-Z0-9._-] */
function sanitizeFilename(name: string): string {
  // Reject path traversal
  if (
    name.includes("../") ||
    name.includes("./") ||
    name.includes("\0") ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    throw new Error("Invalid filename");
  }
  // Strip everything except safe characters
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const auth = await verifyAdmin(request, env);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "Must be multipart/form-data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const uploadType = formData.get("type");

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "No file provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (uploadType !== "cover" && uploadType !== "pdf") {
      return Response.json(
        { error: "type must be 'cover' or 'pdf'" },
        { status: 400, headers: corsHeaders }
      );
    }

    const MAX_SIZE_PDF = 50 * 1024 * 1024;    // 50MB
    const MAX_SIZE_COVER = 5 * 1024 * 1024;   // 5MB

    const fileBuffer = await (file as File).arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    const originalName = (file as File).name || "upload";

    // ── Size check ──
    if (uploadType === "pdf" && fileSize > MAX_SIZE_PDF) {
      return Response.json(
        { error: "PDF exceeds 50MB limit" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (uploadType === "cover" && fileSize > MAX_SIZE_COVER) {
      return Response.json(
        { error: "Cover image exceeds 5MB limit" },
        { status: 400, headers: corsHeaders }
      );
    }

    const firstBytes = new Uint8Array(fileBuffer.slice(0, 12));

    // ── Magic byte validation ──
    if (uploadType === "pdf") {
      // Must be %PDF
      const magic = String.fromCharCode(...firstBytes.slice(0, 4));
      if (magic !== "%PDF") {
        return Response.json(
          { error: "File is not a valid PDF (magic byte check failed)" },
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // Cover image: JPEG (FFD8FF), PNG (89504E47), or WebP (52494646 + ...57454250)
      const isJpeg = firstBytes[0] === 0xff && firstBytes[1] === 0xd8 && firstBytes[2] === 0xff;
      const isPng =
        firstBytes[0] === 0x89 &&
        firstBytes[1] === 0x50 &&
        firstBytes[2] === 0x4e &&
        firstBytes[3] === 0x47;
      const isWebp =
        firstBytes[0] === 0x52 &&
        firstBytes[1] === 0x49 &&
        firstBytes[2] === 0x46 &&
        firstBytes[3] === 0x46 &&
        firstBytes[8] === 0x57 &&
        firstBytes[9] === 0x45 &&
        firstBytes[10] === 0x42 &&
        firstBytes[11] === 0x50;

      if (!isJpeg && !isPng && !isWebp) {
        return Response.json(
          { error: "Cover must be a JPEG, PNG, or WebP image" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // ── Filename sanitization ──
    let safeName: string;
    try {
      safeName = sanitizeFilename(originalName);
    } catch {
      return Response.json(
        { error: "Invalid filename" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Strip extension and re-apply
    const extMatch = safeName.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : uploadType === "pdf" ? ".pdf" : ".jpg";
    const uuid = generateUUID();
    const storagePath = `${uuid}${ext}`;

    // ── Upload to Supabase Storage ──
    const bucket = uploadType === "pdf" ? "magazine-pdfs" : "magazine-covers";
    const mimeType =
      uploadType === "pdf"
        ? "application/pdf"
        : ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

    const uploadRes = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(storagePath)}`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": mimeType,
          "x-upsert": "false",
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Storage upload error:", errText);
      return Response.json(
        { error: "Upload to storage failed" },
        { status: 502, headers: corsHeaders }
      );
    }

    // Return storage path ONLY — never the full URL
    return Response.json(
      { path: storagePath },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Upload error:", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
