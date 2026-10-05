import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/ready", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = {
      ...original,
      POSTGRES_URL: "postgres://x",
      AUTH_SECRET: "x",
      OPENROUTER_API_KEY: "k",
    };
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.DEMO_MODE;
  });
  afterEach(() => {
    process.env = original;
  });

  it("is ok when required env is present", () => {
    const res = GET();
    expect(res.status).toBe(200);
  });

  it("reports not-ready without leaking which variables are missing", async () => {
    delete process.env.POSTGRES_URL;
    delete process.env.OPENROUTER_API_KEY;
    const res = GET();
    const text = await res.text();
    expect(res.status).toBe(503);
    expect(text).not.toContain("POSTGRES_URL");
    expect(text).not.toContain("OPENROUTER");
  });

  it("does not need an AI key in demo mode", () => {
    delete process.env.OPENROUTER_API_KEY;
    process.env.DEMO_MODE = "true";
    expect(GET().status).toBe(200);
  });
});
