import { createBrowserClient } from "@supabase/ssr";

let supabaseClient = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  if (typeof window === "undefined") {
    return createBrowserClient(url, anonKey);
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(url, anonKey);
  }

  return supabaseClient;
}
