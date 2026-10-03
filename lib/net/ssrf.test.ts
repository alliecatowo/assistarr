import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  // biome-ignore lint/suspicious/useAwait: mock must return a promise
  lookup: vi.fn(async (host: string) => {
    const map: Record<string, string> = {
      "public.example": "93.184.216.34",
      "rebind.example": "169.254.169.254",
      "lan.example": "192.168.1.20",
    };
    if (!map[host]) {
      throw new Error("ENOTFOUND");
    }
    return [{ address: map[host], family: 4 }];
  }),
}));

import { assertSafeServiceUrl, classifyIp, safeFetch } from "./ssrf";

describe("ssrf guard", () => {
  beforeEach(() => {
    process.env.ALLOW_PRIVATE_SERVICE_URLS = "false";
  });
  afterEach(() => {
    process.env.ALLOW_PRIVATE_SERVICE_URLS = undefined as never;
    delete process.env.ALLOW_PRIVATE_SERVICE_URLS;
    vi.restoreAllMocks();
  });

  it("allows public hosts", async () => {
    await expect(
      assertSafeServiceUrl("https://public.example:7878")
    ).resolves.toBeInstanceOf(URL);
  });

  it.each([
    "http://169.254.169.254/latest/meta-data/",
    "http://[fd00:ec2::254]/",
    "http://[::ffff:169.254.169.254]/",
    "http://metadata.google.internal/",
    "http://rebind.example/", // resolves to metadata IP
    "http://localhost:3000/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://10.0.0.5/",
    "http://172.16.0.1/",
    "http://192.168.1.1/",
    "http://0.0.0.0/",
    "http://[::ffff:10.0.0.1]/",
    "http://lan.example/",
    "ftp://public.example/",
    "file:///etc/passwd",
    "http://user:pass@public.example/",
    "http://unresolvable.example/",
    "not a url",
  ])("blocks %s", async (u) => {
    await expect(assertSafeServiceUrl(u)).rejects.toThrow();
  });

  it("allows private ranges only with the self-host flag, never metadata", async () => {
    process.env.ALLOW_PRIVATE_SERVICE_URLS = "true";
    await expect(
      assertSafeServiceUrl("http://192.168.1.1:7878")
    ).resolves.toBeTruthy();
    await expect(
      assertSafeServiceUrl("http://lan.example")
    ).resolves.toBeTruthy();
    await expect(
      assertSafeServiceUrl("http://localhost:7878")
    ).resolves.toBeTruthy();
    await expect(
      assertSafeServiceUrl("http://169.254.169.254/")
    ).rejects.toThrow();
    await expect(
      assertSafeServiceUrl("http://rebind.example/")
    ).rejects.toThrow();
    await expect(assertSafeServiceUrl("http://[fe80::1]/")).rejects.toThrow();
  });

  it("classifies edge addresses", () => {
    expect(classifyIp("8.8.8.8")).toBe("ok");
    expect(classifyIp("100.64.0.1")).toBe("private");
    expect(classifyIp("172.32.0.1")).toBe("ok");
    expect(classifyIp("2606:4700::1111")).toBe("ok");
    expect(classifyIp("garbage")).toBe("blocked");
  });

  it("does not follow a redirect into a blocked range", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.redirect("http://169.254.169.254/latest/meta-data/", 302)
      );
    await expect(
      safeFetch("https://public.example/api", {
        headers: { "X-Api-Key": "secret" },
      })
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe("manual");
  });

  it("follows safe redirects and drops credentials across origins", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.redirect("https://public.example:8443/next", 302)
      )
      .mockResolvedValueOnce(new Response("ok"));
    const res = await safeFetch("https://public.example/api", {
      headers: { "X-Api-Key": "secret" },
    });
    expect(await res.text()).toBe("ok");
    const second = fetchMock.mock.calls[1][1]?.headers as Headers;
    expect(second.get("x-api-key")).toBeNull();
  });
});
