import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({ isTestEnvironment: false }));
vi.mock("../constants", () => ({ isTestEnvironment: false }));

import { getLanguageModel, isModelServedByUserConfig } from "./providers";

const cfg = (providerName: string) => ({ providerName, apiKey: "k" }) as never;

describe("BYOK model routing", () => {
  it("direct providers only serve their own models", () => {
    expect(
      isModelServedByUserConfig("anthropic/claude-sonnet-4.5", cfg("anthropic"))
    ).toBe(true);
    expect(
      isModelServedByUserConfig("google/gemini-2.5-pro", cfg("anthropic"))
    ).toBe(false);
    expect(isModelServedByUserConfig("openai/gpt-5.2", cfg("google"))).toBe(
      false
    );
    expect(isModelServedByUserConfig("anything/else", cfg("openrouter"))).toBe(
      true
    );
    expect(isModelServedByUserConfig("anything/else", cfg("gateway"))).toBe(
      true
    );
  });

  it("throws instead of falling back to the app key on a mismatched model", () => {
    expect(() =>
      getLanguageModel("google/gemini-2.5-pro", cfg("anthropic"))
    ).toThrow();
    expect(() => getLanguageModel("openai/gpt-5.2", cfg("google"))).toThrow();
  });

  it("builds a model from the user's key when it matches", () => {
    const m = getLanguageModel("anthropic/claude-sonnet-4.5", cfg("anthropic"));
    expect((m as { provider: string }).provider).toContain("anthropic");
  });

  it("uses the user's own key for gateway BYOK (no system fallback)", () => {
    expect(() =>
      getLanguageModel("google/gemini-2.5-pro", cfg("gateway"))
    ).not.toThrow();
  });
});
