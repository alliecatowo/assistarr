import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getActiveUserAIConfig: vi.fn(),
  getMessageCountByUserId: vi.fn(),
  getClientIp: vi.fn(),
}));

vi.mock("@/app/(auth)/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/queries/index", () => ({
  getActiveUserAIConfig: mocks.getActiveUserAIConfig,
  getMessageCountByUserId: mocks.getMessageCountByUserId,
}));
vi.mock("@/lib/client-ip", () => ({ getClientIp: mocks.getClientIp }));
vi.mock("@/lib/constants", () => ({ isTestEnvironment: false }));

import { validateSessionAndRateLimit } from "./validation";

let n = 0;
const newUser = () => ({ user: { id: `u${++n}`, type: "guest" } });

describe("validateSessionAndRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveUserAIConfig.mockResolvedValue(null);
    mocks.getMessageCountByUserId.mockResolvedValue(0);
    mocks.getClientIp.mockResolvedValue("203.0.113.9");
    mocks.auth.mockImplementation(async () => newUser());
  });

  it("rejects model ids outside the allowed list on the system key", async () => {
    await expect(
      validateSessionAndRateLimit("openai/o3-pro-super-expensive")
    ).rejects.toThrow();
  });

  it("does not give BYOK limits (or the system key) for a model the user's key cannot serve", async () => {
    mocks.getActiveUserAIConfig.mockResolvedValue({
      providerName: "anthropic",
      apiKey: "sk-ant-aaaaaaaa",
    });
    await expect(
      validateSessionAndRateLimit("google/gemini-2.5-pro")
    ).rejects.toThrow();
  });

  it("accepts a BYOK model served by the user's own key", async () => {
    mocks.getActiveUserAIConfig.mockResolvedValue({
      providerName: "anthropic",
      apiKey: "sk-ant-aaaaaaaa",
    });
    const r = await validateSessionAndRateLimit("anthropic/claude-sonnet-4.5");
    expect(r.userAIConfig?.providerName).toBe("anthropic");
  });

  it("enforces the daily quota exactly (no off-by-one)", async () => {
    mocks.getMessageCountByUserId.mockResolvedValue(50);
    await expect(
      validateSessionAndRateLimit("google/gemini-2.5-flash")
    ).rejects.toThrow();
  });

  it("binds quota to the IP so fresh guest accounts do not reset it", async () => {
    mocks.getClientIp.mockResolvedValue("198.51.100.77");
    // guest per-minute = 10, IP per-minute = 30; each call is a new account
    let allowed = 0;
    for (let i = 0; i < 40; i++) {
      try {
        await validateSessionAndRateLimit("google/gemini-2.5-flash");
        allowed++;
      } catch {
        /* rate limited */
      }
    }
    expect(allowed).toBe(30);
  });
});
