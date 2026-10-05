import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decrypt,
  encrypt,
  isEncryptionConfigured,
  openSecret,
  sealSecret,
} from "./crypto";

describe("Service Config Encryption", () => {
  it("should encrypt and decrypt correctly when encryption is configured", () => {
    if (!isEncryptionConfigured()) {
      console.warn("ENCRYPTION_KEY not set, skipping encryption test");
      return;
    }

    const apiKey = "test-api-key-12345";
    const encrypted = encrypt(apiKey);
    const decrypted = decrypt(encrypted);

    expect(encrypted).not.toBe(apiKey);
    expect(decrypted).toBe(apiKey);
  });

  it("should throw error when decrypting invalid data", () => {
    if (!isEncryptionConfigured()) {
      console.warn("ENCRYPTION_KEY not set, skipping decryption test");
      return;
    }

    expect(() => decrypt("invalid-base64-data")).toThrow();
  });
});

describe("versioned secret storage (v2)", () => {
  const KEY = "k9Tj2mQ8vXr4Lw7ZpB1nHc6YsD3fG5aE0uVtIoR+eM=";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips and binds the ciphertext to its owner", () => {
    vi.stubEnv("ENCRYPTION_KEY", KEY);
    const sealed = sealSecret("radarr-key-123", "user-a");

    expect(sealed.startsWith("v2:")).toBe(true);
    expect(sealed).not.toContain("radarr-key-123");
    expect(openSecret(sealed, "user-a")).toEqual({
      value: "radarr-key-123",
      legacy: false,
    });
    // Same ciphertext copied into another user's row must not open.
    expect(() => openSecret(sealed, "user-b")).toThrow(/Decryption failed/);
  });

  it("throws on tampered or wrong-key v2 data instead of returning it", () => {
    vi.stubEnv("ENCRYPTION_KEY", KEY);
    const sealed = sealSecret("secret", "u");
    const tampered = `${sealed.slice(0, -4)}AAAA`;
    expect(() => openSecret(tampered, "u")).toThrow(/Decryption failed/);

    vi.stubEnv("ENCRYPTION_KEY", `${KEY}-rotated-key-xxxxxxxx`);
    expect(() => openSecret(sealed, "u")).toThrow(/Decryption failed/);
  });

  it("refuses to seal without a usable key (no plaintext fallback)", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    expect(() => sealSecret("secret", "u")).toThrow(/ENCRYPTION_KEY/);
    vi.stubEnv("ENCRYPTION_KEY", "too-short");
    expect(() => sealSecret("secret", "u")).toThrow(/at least 32/);
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "change-me-generate-with-openssl-rand-base64-32"
    );
    expect(() => sealSecret("secret", "u")).toThrow(/placeholder/);
    expect(isEncryptionConfigured()).toBe(false);
  });

  it("opens pre-v2 ciphertext and plaintext, flagging both for upgrade", () => {
    vi.stubEnv("ENCRYPTION_KEY", KEY);
    expect(openSecret(encrypt("old-key"), "u")).toEqual({
      value: "old-key",
      legacy: true,
    });
    expect(openSecret("plain-old-key", "u")).toEqual({
      value: "plain-old-key",
      legacy: true,
    });
  });

  it("does not read legacy rows when the key is missing", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    expect(() => openSecret("plain-old-key", "u")).toThrow(/ENCRYPTION_KEY/);
  });
});
