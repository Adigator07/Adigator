import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createServerSupabaseClient, isSupabaseConfigured } from "./supabaseServer";

describe("supabase server fallback", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    }
  });

  it("reports that Supabase is not configured when env vars are missing", () => {
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("creates a safe client instead of throwing when Supabase is not configured", () => {
    expect(() => createServerSupabaseClient("test-token")).not.toThrow();
  });
});
