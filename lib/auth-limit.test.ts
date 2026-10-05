import { beforeEach, describe, expect, it, vi } from "vitest";

const ip = vi.hoisted(() => ({ value: "192.0.2.1" }));
vi.mock("@/lib/client-ip", () => ({ getClientIp: async () => ip.value }));

import { loginAttemptAllowed, registrationAllowed } from "./auth-limit";

describe("auth rate limits", () => {
  beforeEach(() => {
    ip.value = `192.0.2.${Math.floor(Math.random() * 250)}`;
  });

  it("locks out guessing against one account after 10 attempts", async () => {
    const email = `victim-${Math.random()}@example.com`;
    const results: boolean[] = [];
    for (let i = 0; i < 12; i++) {
      results.push(await loginAttemptAllowed(email));
    }
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(results.slice(10)).toEqual([false, false]);
    // a different account from a different client is unaffected
    ip.value = "198.51.100.77";
    expect(
      await loginAttemptAllowed(`other-${Math.random()}@example.com`)
    ).toBe(true);
  });

  it("limits one client sweeping many accounts", async () => {
    let ok = 0;
    for (let i = 0; i < 40; i++) {
      if (await loginAttemptAllowed(`user-${i}-${Math.random()}@example.com`)) {
        ok++;
      }
    }
    expect(ok).toBe(30);
  });

  it("caps registrations per IP", async () => {
    let ok = 0;
    for (let i = 0; i < 9; i++) {
      if (await registrationAllowed()) {
        ok++;
      }
    }
    expect(ok).toBe(5);
  });

  it("does not throttle everyone as one client when the IP is unknown", async () => {
    ip.value = "unknown";
    for (let i = 0; i < 20; i++) {
      expect(await registrationAllowed()).toBe(true);
    }
  });
});
