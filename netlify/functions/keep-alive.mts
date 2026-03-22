import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async function handler() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from("site_content").select("id").limit(1);

  if (error) {
    console.error("Keep-alive ping failed:", error.message);
    return new Response("Ping failed", { status: 500 });
  }

  console.log("Supabase keep-alive ping successful");
  return new Response("OK", { status: 200 });
}

export const config: Config = {
  schedule: "@daily",
};
