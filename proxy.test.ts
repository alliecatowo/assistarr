import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getToken = vi.fn();
vi.mock("next-auth/jwt", () => ({
  getToken: (...a: unknown[]) => getToken(...a),
}));

import { proxy } from "./proxy";

describe("proxy auth", () => {
  beforeEach(() => getToken.mockReset());

  it("answers cookieless API calls with 401 instead of minting a guest", async () => {
    getToken.mockResolvedValue(null);
    const res = await proxy(
      new NextRequest("http://localhost/api/chat", { method: "POST" })
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("still bounces cookieless page navigations through guest sign-in", async () => {
    getToken.mockResolvedValue(null);
    const res = await proxy(new NextRequest("http://localhost/home"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/guest");
  });

  describe("landing page", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("bounces / through guest sign-in when not a public demo", async () => {
      getToken.mockResolvedValue(null);
      const res = await proxy(new NextRequest("http://localhost/"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/api/auth/guest");
    });

    it("shows the landing at / in the demo without minting a guest", async () => {
      vi.stubEnv("DEMO_MODE", "true");
      getToken.mockResolvedValue(null);
      const res = await proxy(new NextRequest("http://localhost/"));
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("still guest-bounces other pages in the demo", async () => {
      vi.stubEnv("DEMO_MODE", "true");
      getToken.mockResolvedValue(null);
      const res = await proxy(new NextRequest("http://localhost/home"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/api/auth/guest");
    });

    it("keeps the cookie check ahead of the landing in the demo", async () => {
      vi.stubEnv("DEMO_MODE", "true");
      getToken.mockResolvedValue(null);
      const res = await proxy(new NextRequest("http://localhost/?_g=1"));
      expect(await res.text()).toContain("Cookies required");
    });

    it("serves landing assets without minting a guest", async () => {
      getToken.mockResolvedValue(null);
      for (const path of ["/logo.svg", "/landing/chat-dark.webp"]) {
        const res = await proxy(new NextRequest(`http://localhost${path}`));
        expect(res.headers.get("location")).toBeNull();
        expect(res.headers.get("x-middleware-next")).toBe("1");
      }
      expect(getToken).not.toHaveBeenCalled();
    });

    it("sends a visitor with a session from / to /home", async () => {
      vi.stubEnv("DEMO_MODE", "true");
      getToken.mockResolvedValue({ email: "guest-123", id: "u" });
      const res = await proxy(new NextRequest("http://localhost/"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost/home");
    });
  });

  it("lets health and ready probes through without a session", async () => {
    getToken.mockResolvedValue(null);
    for (const path of ["/api/health", "/api/ready"]) {
      const res = await proxy(new NextRequest(`http://localhost${path}`));
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
      expect(getToken).not.toHaveBeenCalled();
    }
  });

  it("stops the guest redirect loop for clients that drop cookies", async () => {
    getToken.mockResolvedValue(null);
    const res = await proxy(new NextRequest("http://localhost/?_g=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.text()).toContain("Cookies required");
  });

  it("strips the guest marker once the session exists", async () => {
    getToken.mockResolvedValue({ email: "guest-123", id: "u" });
    const res = await proxy(new NextRequest("http://localhost/chat/abc?_g=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/chat/abc");
  });
});
