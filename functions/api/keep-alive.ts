import { createClient } from "@supabase/supabase-js";

/**
 * Cloudflare Pages Function for Supabase Keep-Alive
 *
 * This must be manually triggered periodically as Cloudflare Pages
 * does not support native cron triggers in the functions/ folder.
 *
 * Security:
 * - Requires X-Keepalive-Key header matching KEEPALIVE_SECRET env var
 * - Uses non-VITE_ env var names (VITE_ prefix vars are public build-time vars)
 *
 * Trigger via cron job or GitHub Actions:
 *   curl -X GET https://sabraleos.org/api/keep-alive \
 *     -H "X-Keepalive-Key: YOUR_SECRET"
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  KEEPALIVE_SECRET?: string; // Optional — set in CF Dashboard if desired
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // If a keepalive secret is configured, enforce it
  if (env.KEEPALIVE_SECRET) {
    const providedKey = request.headers.get("X-Keepalive-Key");
    if (providedKey !== env.KEEPALIVE_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabaseUrl = env.SUPABASE_URL || (env as any).VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || (env as any).VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Keep-alive: Supabase env vars not configured.");
    return new Response("Configuration error", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.from("site_content").select("id").limit(1);

  if (error) {
    console.error("Keep-alive ping failed:", error.message);
    return new Response("Ping failed", { status: 500 });
  }

  console.log("Supabase keep-alive ping successful");
  return new Response("OK", { status: 200 });
};
