import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock postgres before importing the route
vi.mock("postgres", () => {
  return {
    default: vi.fn(() => {
      const sql = Object.assign(
        vi.fn(() => Promise.resolve([{ "?column?": 1 }])),
        {
          end: vi.fn(() => Promise.resolve()),
        }
      );
      return sql;
    }),
  };
});

// Mock dynamic redis import
vi.mock("redis", () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    ping: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe("GET /api/health", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = {
      ...originalEnv,
      POSTGRES_URL: "postgres://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
      OPENROUTER_API_KEY: "test-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("returns 200 with healthy status when all checks pass", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeTypeOf("number");
    expect(body.checks.env.status).toBe("pass");
    expect(body.checks.database.status).toBe("pass");
  });

  it("returns 503 with unhealthy status when env vars are missing", async () => {
    process.env.POSTGRES_URL = undefined;
    process.env.AUTH_SECRET = undefined;
    process.env.OPENROUTER_API_KEY = undefined;
    process.env.AI_GATEWAY_API_KEY = undefined;

    // Re-import to pick up env changes
    vi.resetModules();
    vi.doMock("postgres", () => ({
      default: vi.fn(() =>
        Object.assign(
          vi.fn(() => Promise.resolve([])),
          {
            end: vi.fn(),
          }
        )
      ),
    }));

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.env.status).toBe("fail");
  });

  it("does not expose per-user service data, env names or error text", async () => {
    process.env.AUTH_SECRET = "";
    const { GET } = await import("./route");
    const response = await GET();
    const text = JSON.stringify(await response.json());

    expect(text).not.toContain("services");
    expect(text).not.toContain("AUTH_SECRET");
    expect(text).not.toContain("POSTGRES_URL");
    expect(text).not.toContain("message");
  });

  it("omits redis check when REDIS_URL is not set", async () => {
    process.env.REDIS_URL = undefined;

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body.checks.redis).toBeUndefined();
  });

  it("sets Cache-Control header to no-cache", async () => {
    const { GET } = await import("./route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate"
    );
  });

  it("is healthy in demo mode without an AI provider key", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.DEMO_MODE = "true";
    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
  });
});
