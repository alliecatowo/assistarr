import { describe, expect, it } from "vitest";
import { isWeakSecret } from "./secret-strength";

describe("isWeakSecret", () => {
  it("rejects empty, short and whitespace-only values", () => {
    expect(isWeakSecret(undefined)).toBe(true);
    expect(isWeakSecret("")).toBe(true);
    expect(isWeakSecret("   ")).toBe(true);
    expect(isWeakSecret("short")).toBe(true);
    expect(isWeakSecret("a".repeat(31))).toBe(true);
  });

  it("rejects the .env.example placeholders even when long enough", () => {
    expect(isWeakSecret("change-me-generate-with-openssl-rand-base64-32")).toBe(
      true
    );
    expect(isWeakSecret("changeme".padEnd(40, "x"))).toBe(true);
    expect(isWeakSecret("your-secret-here".padEnd(40, "x"))).toBe(true);
  });

  it("accepts a real generated secret", () => {
    expect(isWeakSecret("k9Tj2mQ8vXr4Lw7ZpB1nHc6YsD3fG5aE0uVtIoR+eM=")).toBe(
      false
    );
  });
});
