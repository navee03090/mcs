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

export function getSupabaseSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ""
  );
}

export function getAiApiKey() {
  return (
    process.env.AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    ""
  );
}

export function envStatus() {
  return {
    supabaseUrl: Boolean(getSupabaseUrl()),
    supabasePublishableKey: Boolean(getSupabasePublishableKey()),
    supabaseServiceRoleKey: Boolean(getSupabaseSecretKey()),
    geminiApiKey: Boolean(getAiApiKey()),
    openaiApiKey: Boolean(process.env.OPENAI_API_KEY),
    aiModel: process.env.AI_MODEL ?? "gemini-3-8-flash",
  };
}
