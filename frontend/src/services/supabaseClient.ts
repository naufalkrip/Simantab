import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "FATAL CONFIGURATION ERROR: Supabase URL or Anon Key are missing. " +
    "If you are deploying on Netlify, please ensure 'VITE_SUPABASE_URL' and 'VITE_SUPABASE_ANON_KEY' " +
    "are set in your Site settings -> Environment variables."
  );
  // We don't throw here to prevent a blank white screen upon load.
}

console.log("Supabase Client initialized securely.");

// Use placeholder to prevent createClient from throwing an error about invalid URL if missing
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);

export default supabase;
