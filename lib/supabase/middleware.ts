import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { safeFetch } from "@/lib/supabase/safe-fetch";

const hasAuthCookie = (request: NextRequest): boolean =>
  request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"));

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      global: {
        fetch: safeFetch,
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Skip lock-heavy getUser when no session cookie (e.g. /login before sign-in)
  if (hasAuthCookie(request)) {
    await supabase.auth.getUser();
  }

  return supabaseResponse;
};
