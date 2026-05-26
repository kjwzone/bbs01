import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { safeFetch } from "@/lib/supabase/safe-fetch";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Avoid navigator.lock deadlock with Next.js middleware on Windows. */
const lockNoOp = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
): Promise<T> => fn();

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
      auth: {
        lock: lockNoOp,
        lockAcquireTimeout: 5000,
      },
    },
  );

  return browserClient;
};
