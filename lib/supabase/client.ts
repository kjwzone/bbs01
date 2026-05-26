import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { safeFetch } from "@/lib/supabase/safe-fetch";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const createClient = () => {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      global: {
        fetch: safeFetch,
      },
    },
  );

  return browserClient;
};
