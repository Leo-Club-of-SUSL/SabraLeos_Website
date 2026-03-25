import { createClient } from "@supabase/supabase-js";

/**
 * Cloudflare Pages Function for Supabase Keep-Alive
 * This must be manually triggered periodically as Cloudflare Pages
 * does not support native cron triggers in the functions/ folder.
 */

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY
  );

  const { error } = await supabase.from("site_content").select("id").limit(1);

  if (error) {
    console.error("Keep-alive ping failed:", error.message);
    return new Response("Ping failed", { status: 500 });
  }

  console.log("Supabase keep-alive ping successful");
  return new Response("OK", { status: 200 });
};
