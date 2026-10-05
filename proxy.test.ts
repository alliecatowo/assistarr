import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    const res = await proxy(new NextRequest("http://localhost/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/guest");
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
