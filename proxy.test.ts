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
});
