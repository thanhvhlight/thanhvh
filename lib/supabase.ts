import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export function db() {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
