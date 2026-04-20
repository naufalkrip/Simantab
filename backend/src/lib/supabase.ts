import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan di environment!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
