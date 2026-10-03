import { describe, expect, it } from "vitest";
import { safeUploadName, sniffImageType } from "./upload-validation";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]);

describe("sniffImageType", () => {
  it("detects png and jpeg by magic bytes", () => {
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
  });

  it("rejects html, svg and truncated input", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script>");
    expect(sniffImageType(html)).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<svg/>"))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("safeUploadName", () => {
  it("forces the extension from the sniffed type", () => {
    expect(safeUploadName("evil.html", "image/png")).toBe("evil.png");
    expect(safeUploadName("photo.PNG", "image/jpeg")).toBe("photo.jpg");
  });

  it("strips path segments and unsafe characters", () => {
    expect(safeUploadName("../../etc/passwd", "image/png")).toBe("passwd.png");
    expect(safeUploadName("C:\\x\\a b<c>.png", "image/png")).toBe("a-b-c.png");
  });

  it("falls back for empty names and caps length", () => {
    expect(safeUploadName(undefined, "image/png")).toBe("upload.png");
    expect(safeUploadName("...", "image/jpeg")).toBe("upload.jpg");
    expect(safeUploadName(`${"a".repeat(200)}.png`, "image/png").length).toBe(
      68
    );
  });
});
