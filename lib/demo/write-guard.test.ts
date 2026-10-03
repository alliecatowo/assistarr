import { afterEach, describe, expect, it } from "vitest";
import { limitLlmRoute } from "@/lib/llm-route-limit";
import { demoWriteBlockedResponse } from "./mode";

describe("demo write guard", () => {
  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  it("returns 403 in demo mode and null otherwise", () => {
    expect(demoWriteBlockedResponse()).toBeNull();
    process.env.DEMO_MODE = "true";
    const res = demoWriteBlockedResponse();
    expect(res?.status).toBe(403);
  });
});

describe("llm route limiter", () => {
  it("allows a burst then returns 429 with Retry-After", async () => {
    let limited: Response | null = null;
    for (let i = 0; i < 40; i++) {
      limited = await limitLlmRoute("user-x", "pitch");
      if (limited) {
        break;
      }
    }
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("Retry-After")).toBeTruthy();
    expect(await limitLlmRoute("other-user", "pitch")).toBeNull();
  });
});
