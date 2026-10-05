import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
const put = vi.hoisted(() => vi.fn());
vi.mock("@/app/(auth)/auth", () => ({ auth }));
vi.mock("@vercel/blob", () => ({ put }));

import { POST } from "./route";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0,
]);

function upload() {
  const form = new FormData();
  form.set("file", new File([PNG], "a.png", { type: "image/png" }));
  return POST(
    new Request("http://localhost/api/files/upload", {
      method: "POST",
      body: form,
    })
  );
}

describe("POST /api/files/upload quota", () => {
  beforeEach(() => {
    put.mockResolvedValue({
      url: "https://s.public.blob.vercel-storage.com/a.png",
    });
  });

  it("rate limits uploads per user and isolates users", async () => {
    auth.mockResolvedValue({
      user: { id: `u-${Math.random()}`, type: "regular" },
    });
    const statuses: number[] = [];
    for (let i = 0; i < 22; i++) {
      statuses.push((await upload()).status);
    }
    expect(statuses.filter((s) => s === 200)).toHaveLength(20);
    expect(statuses.slice(20)).toEqual([429, 429]);

    auth.mockResolvedValue({
      user: { id: `u-${Math.random()}`, type: "regular" },
    });
    expect((await upload()).status).toBe(200);
  });

  it("blocks guests", async () => {
    auth.mockResolvedValue({ user: { id: "g", type: "guest" } });
    expect((await upload()).status).toBe(403);
  });
});
