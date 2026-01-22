import { describe, expect, it } from "vitest";
import { decrypt, encrypt, isEncryptionConfigured } from "./crypto";

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
