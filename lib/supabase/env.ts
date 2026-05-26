import { SUPABASE_PROJECT_URL } from "./project";

const sanitizeAscii = (value: string): string =>
  value.trim().replace(/[^\x20-\x7E]/g, "");

/** Supabase API URL — env first, then committed project default. */
export const getSupabaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    const cleaned = sanitizeAscii(raw);
    if (cleaned) {
      return cleaned;
    }
  }
  return SUPABASE_PROJECT_URL;
};

export const getSupabaseAnonKey = (): string => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local (local) or Vercel Environment Variables (deploy), then rebuild.",
    );
  }
  const cleaned = sanitizeAscii(raw);
  if (!cleaned) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty after sanitization.");
  }
  return cleaned;
};

export const getSiteUrl = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    const cleaned = sanitizeAscii(fromEnv);
    if (cleaned) {
      return cleaned;
    }
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};
