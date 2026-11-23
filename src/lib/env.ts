/**
 * Shared env helpers. Prefer PUBLISHABLE_KEY; ANON_KEY still works as fallback.
 */
export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function envStatus() {
  return {
    supabaseUrl: Boolean(getSupabaseUrl()),
    supabasePublishableKey: Boolean(getSupabasePublishableKey()),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    openaiApiKey: Boolean(process.env.OPENAI_API_KEY),
  };
}
