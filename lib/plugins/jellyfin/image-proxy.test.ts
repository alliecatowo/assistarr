import { describe, expect, it } from "vitest";
import { getImageUrl } from "./client";
import { getProxiedImageUrl, parseImageRequest } from "./image-proxy";

describe("jellyfin image urls", () => {
  it("proxied urls are same-origin and carry no credentials or base url", () => {
    const url = getProxiedImageUrl(
      "0123456789abcdef0123456789abcdef",
      "Primary",
      500
    );
    expect(url.startsWith("/api/jellyfin/image?")).toBe(true);
    expect(url).not.toMatch(/api_key|apikey|http/i);
  });

  it("direct image urls never embed an api key", () => {
    // The old fifth argument no longer exists; extra args must not leak.
    const url = (getImageUrl as (...a: unknown[]) => string)(
      "http://jf:8096",
      "abc",
      "Primary",
      500,
      "SECRETKEY"
    );
    expect(url).not.toContain("SECRETKEY");
    expect(url).not.toContain("api_key");
  });
});

describe("parseImageRequest", () => {
  const id = "0123456789abcdef0123456789abcdef";
  const parse = (q: string) => parseImageRequest(new URLSearchParams(q));

  it("accepts valid requests", () => {
    expect(parse(`id=${id}`)).toEqual({ id, type: "Primary" });
    expect(parse(`id=${id}&type=Backdrop&maxWidth=500`)).toEqual({
      id,
      type: "Backdrop",
      maxWidth: 500,
    });
  });

  it.each([
    "id=../../System/Info",
    "id=abc",
    `id=${id}&type=../Users`,
    `id=${id}&type=Primary%3Fapi_key%3Dx`,
    `id=${id}&maxWidth=0`,
    `id=${id}&maxWidth=99999`,
    `id=${id}&maxWidth=1.5`,
    "type=Primary",
  ])("rejects %s", (q) => {
    expect(parse(q)).toBeNull();
  });
});
