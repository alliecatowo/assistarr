import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

import { isWeakSecret } from "./secret-strength";

// AES-256-GCM configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length (96 bits)
const AUTH_TAG_LENGTH = 16; // GCM authentication tag length (128 bits)
const KEY_LENGTH = 32; // AES-256 requires 32 bytes (256 bits)
const SALT_LENGTH = 16; // Salt for key derivation

// Derive a 256-bit key from the encryption key using scrypt
function deriveKey(encryptionKey: string, salt: Buffer): Buffer {
  return scryptSync(encryptionKey, salt, KEY_LENGTH);
}

// Get the encryption key from environment, throwing if not configured
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Please generate a secure key using: openssl rand -base64 32"
    );
  }
  if (isWeakSecret(key)) {
    throw new Error(
      "ENCRYPTION_KEY must be at least 32 characters and not a placeholder. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * The output format is: base64(salt + iv + authTag + ciphertext)
 * - salt: 16 bytes for key derivation
 * - iv: 12 bytes (96 bits) initialization vector
 * - authTag: 16 bytes (128 bits) authentication tag
 * - ciphertext: variable length encrypted data
 *
 * @param plaintext - The string to encrypt
 * @returns Base64 encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  const encryptionKey = getEncryptionKey();

  // Generate random salt and IV for each encryption
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from password and salt
  const key = deriveKey(encryptionKey, salt);

  // Create cipher and encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine all components: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, ciphertext]);

  return combined.toString("base64");
}

/**
 * Decrypts a base64 encoded ciphertext that was encrypted with the encrypt function.
 *
 * @param encryptedData - Base64 encoded encrypted data
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(encryptedData: string): string {
  const encryptionKey = getEncryptionKey();

  // Decode the base64 data
  const combined = Buffer.from(encryptedData, "base64");

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = combined.subarray(
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );

  // Validate minimum length
  if (combined.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data: data too short");
  }

  // Derive key from password and salt
  const key = deriveKey(encryptionKey, salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    // GCM authentication failure or other decryption error
    throw new Error(
      "Decryption failed: data may be corrupted or encrypted with a different key"
    );
  }
}

/**
 * Checks if the encryption key is configured in the environment.
 * Useful for startup validation without throwing.
 *
 * @returns true if ENCRYPTION_KEY is set and meets minimum requirements
 */
export function isEncryptionConfigured(): boolean {
  return !isWeakSecret(process.env.ENCRYPTION_KEY);
}

// ---------------------------------------------------------------------------
// Versioned secret storage (v2)
//
// Format: "v2:" + base64(iv + authTag + ciphertext)
// - The key is derived once per process (not once per field per request).
// - `aad` (the owning user id) is bound into the GCM tag, so a ciphertext
//   copied into another user's row fails to decrypt.
// - There is no plaintext fallback: sealing without a valid ENCRYPTION_KEY
//   throws, and a v2 value that fails to decrypt throws.
// ---------------------------------------------------------------------------

const V2_PREFIX = "v2:";
const V2_SALT = "assistarr/secret/v2";
let cachedV2Key: { source: string; key: Buffer } | null = null;

function getV2Key(): Buffer {
  const source = getEncryptionKey();
  if (cachedV2Key?.source !== source) {
    cachedV2Key = { source, key: scryptSync(source, V2_SALT, KEY_LENGTH) };
  }
  return cachedV2Key.key;
}

/** Encrypts a secret for storage. Throws if ENCRYPTION_KEY is unusable. */
export function sealSecret(plaintext: string, aad: string): string {
  const key = getV2Key();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const combined = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
  return V2_PREFIX + combined.toString("base64");
}

export interface OpenedSecret {
  value: string;
  /** True when the stored value predates v2 and should be re-sealed. */
  legacy: boolean;
}

/**
 * Decrypts a stored secret.
 * - v2 values must decrypt (wrong key, wrong owner or tampering throws).
 * - Un-prefixed values are rows written before v2: tried as the old
 *   ciphertext format, otherwise treated as legacy plaintext and flagged
 *   `legacy` so the caller re-seals them.
 */
export function openSecret(stored: string, aad: string): OpenedSecret {
  if (stored.startsWith(V2_PREFIX)) {
    const combined = Buffer.from(stored.slice(V2_PREFIX.length), "base64");
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Invalid encrypted data: data too short");
    }
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    try {
      const decipher = createDecipheriv(ALGORITHM, getV2Key(), iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAAD(Buffer.from(aad, "utf8"));
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return { value: plaintext.toString("utf8"), legacy: false };
    } catch {
      throw new Error(
        "Decryption failed: data may be corrupted, belong to another user or use a different ENCRYPTION_KEY"
      );
    }
  }

  // Pre-v2 rows. A valid key is still required to read or upgrade them.
  getEncryptionKey();
  try {
    return { value: decrypt(stored), legacy: true };
  } catch {
    return { value: stored, legacy: true };
  }
}
