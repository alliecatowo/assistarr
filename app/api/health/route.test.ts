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
    vi.mock("postgres", () => ({
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

  it("includes services object in response", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body.services).toBeDefined();
    expect(typeof body.services).toBe("object");
    // Services are null (DB available but no service rows in test mock)
    // or have configured property
    for (const service of ["jellyfin", "radarr", "sonarr", "jellyseerr"]) {
      const status = body.services[service];
      if (status !== null) {
        expect(status).toHaveProperty("configured");
      }
    }
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
});
