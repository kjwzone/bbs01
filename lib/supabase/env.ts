/** Strip BOM, whitespace, and non-ASCII from public env vars (invalid in fetch headers). */
export const readPublicEnv = (name: string): string => {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return raw.trim().replace(/[^\x20-\x7E]/g, "");
};

export const getSupabaseUrl = (): string => readPublicEnv("NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseAnonKey = (): string =>
  readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const getSiteUrl = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/[^\x20-\x7E]/g, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};
