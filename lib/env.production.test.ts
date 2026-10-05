import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GOOD = "k9Tj2mQ8vXr4Lw7ZpB1nHc6YsD3fG5aE0uVtIoR+eM=";

async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules();
  // Make the module see a real production process, not the vitest one.
  for (const key of [
    "VITEST",
    "PLAYWRIGHT",
    "CI_PLAYWRIGHT",
    "SKIP_ENV_VALIDATION",
  ]) {
    vi.stubEnv(key, "");
  }
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("POSTGRES_URL", "postgres://u:p@h:5432/d");
  vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test");
  for (const [k, v] of Object.entries(vars)) {
    vi.stubEnv(k, v ?? "");
  }
  return await import("./env");
}

describe("production env validation", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_MODE", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("boots with a strong AUTH_SECRET and ENCRYPTION_KEY", async () => {
    await expect(
      loadEnv({ AUTH_SECRET: GOOD, ENCRYPTION_KEY: GOOD })
    ).resolves.toBeDefined();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["short", "tooshort"],
    ["placeholder", "change-me-generate-with-openssl-rand-base64-32"],
  ])("rejects a %s ENCRYPTION_KEY in production", async (_n, value) => {
    await expect(
      loadEnv({ AUTH_SECRET: GOOD, ENCRYPTION_KEY: value })
    ).rejects.toThrow(/Invalid environment variables/);
  });

  it.each([
    ["short", "tooshort"],
    ["placeholder", "change-me-generate-with-openssl-rand-base64-32"],
  ])("rejects a %s AUTH_SECRET", async (_n, value) => {
    await expect(
      loadEnv({ AUTH_SECRET: value, ENCRYPTION_KEY: GOOD })
    ).rejects.toThrow(/Invalid environment variables/);
  });

  it("exempts the public demo, which stores no credentials", async () => {
    await expect(
      loadEnv({ AUTH_SECRET: GOOD, ENCRYPTION_KEY: "", DEMO_MODE: "true" })
    ).resolves.toBeDefined();
  });
});
