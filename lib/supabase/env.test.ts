import { describe, expect, it, vi } from "vitest";
import { SUPABASE_PROJECT_URL } from "./project";
import { getSupabaseUrl } from "./env";

describe("getSupabaseUrl", () => {
  it("falls back to project URL when env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(getSupabaseUrl()).toBe(SUPABASE_PROJECT_URL);
    vi.unstubAllEnvs();
  });
});
