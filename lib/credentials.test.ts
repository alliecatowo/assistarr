import { describe, expect, it } from "vitest";
import { credentialsSchema } from "./credentials";

describe("credentialsSchema", () => {
  it("normalizes email case and whitespace", () => {
    const parsed = credentialsSchema.parse({
      email: "  Alice@Example.COM ",
      password: "hunter22",
    });
    expect(parsed.email).toBe("alice@example.com");
  });

  it("rejects passwords bcrypt would silently truncate", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "x".repeat(72) })
        .success
    ).toBe(true);
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "x".repeat(73) })
        .success
    ).toBe(false);
    // multi-byte: 37 chars x 2 bytes = 74 bytes
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "é".repeat(37) })
        .success
    ).toBe(false);
  });

  it("rejects short passwords and oversized emails", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "12345" })
        .success
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: `${"a".repeat(250)}@b.co`,
        password: "123456",
      }).success
    ).toBe(false);
  });
});
