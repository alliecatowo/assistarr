import { describe, expect, it } from "vitest";
import { userMessageSchema } from "./schema";

const message = (url: string) => ({
  id: "6f1c2a52-3c0e-4b1e-9d7a-0f6a1c2b3d4e",
  role: "user",
  parts: [{ type: "file", mediaType: "image/png", name: "a.png", url }],
});

describe("chat file part url", () => {
  it("accepts an uploaded blob url", () => {
    const result = userMessageSchema.safeParse(
      message("https://s1.public.blob.vercel-storage.com/a-1.png")
    );
    expect(result.success).toBe(true);
  });

  it.each([
    "http://s1.public.blob.vercel-storage.com/a.png",
    "https://169.254.169.254/latest/meta-data/",
    "https://internal.example.com/a.png",
    "data:image/png;base64,AAAA",
  ])("rejects %s", (url) => {
    expect(userMessageSchema.safeParse(message(url)).success).toBe(false);
  });
});
