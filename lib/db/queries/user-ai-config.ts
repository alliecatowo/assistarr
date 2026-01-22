import { and, eq } from "drizzle-orm";
import { decrypt, encrypt, isEncryptionConfigured } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { db } from "../db";
import { type UserAIConfig, userAIConfig } from "../schema";
import { withTransaction } from "../utils";

/**
 * Decrypts the API key in a user AI config if encryption is configured.
 * Falls back to returning the config as-is for legacy unencrypted data.
 */
function decryptConfig(config: UserAIConfig): UserAIConfig {
  if (!isEncryptionConfigured()) {
    return config;
  }
  try {
    return {
      ...config,
      apiKey: decrypt(config.apiKey),
    };
  } catch {
    // Return as-is if decryption fails (legacy unencrypted data)
    return config;
  }
}

/**
 * Encrypts an API key if encryption is configured.
 */
function encryptApiKey(apiKey: string): string {
  if (!isEncryptionConfigured()) {
    return apiKey;
  }
  return encrypt(apiKey);
}

export async function getUserAIConfigs({
  userId,
}: {
  userId: string;
}): Promise<UserAIConfig[]> {
  try {
    const configs = await db
      .select()
      .from(userAIConfig)
      .where(eq(userAIConfig.userId, userId));
    return configs.map(decryptConfig);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user AI configs"
    );
  }
}

export async function getUserAIConfig({
  userId,
  providerName,
}: {
  userId: string;
  providerName: string;
}): Promise<UserAIConfig | null> {
  try {
    const [config] = await db
      .select()
      .from(userAIConfig)
      .where(
        and(
          eq(userAIConfig.userId, userId),
          eq(userAIConfig.providerName, providerName)
        )
      );
    return config ? decryptConfig(config) : null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user AI config"
    );
  }
}

/**
 * Get the first enabled user AI config for a user.
 * Checks providers in priority order: openrouter, gateway, openai, anthropic, google
 */
export async function getActiveUserAIConfig({
  userId,
}: {
  userId: string;
}): Promise<UserAIConfig | null> {
  try {
    const configs = await getUserAIConfigs({ userId });
    const enabledConfigs = configs.filter((c) => c.isEnabled);

    // Priority order for providers
    const priorityOrder = [
      "openrouter",
      "gateway",
      "openai",
      "anthropic",
      "google",
    ];

    for (const provider of priorityOrder) {
      const config = enabledConfigs.find((c) => c.providerName === provider);
      if (config) {
        return config;
      }
    }

    // Return the first enabled config if no priority match
    return enabledConfigs[0] ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get active user AI config"
    );
  }
}

export async function upsertUserAIConfig({
  userId,
  providerName,
  apiKey,
  isEnabled = true,
}: {
  userId: string;
  providerName: string;
  apiKey: string;
  isEnabled?: boolean;
}): Promise<UserAIConfig> {
  try {
    return await withTransaction(async (tx) => {
      const [existingConfig] = await tx
        .select()
        .from(userAIConfig)
        .where(
          and(
            eq(userAIConfig.userId, userId),
            eq(userAIConfig.providerName, providerName)
          )
        );

      const encryptedApiKey = encryptApiKey(apiKey);

      if (existingConfig) {
        const [updatedConfig] = await tx
          .update(userAIConfig)
          .set({
            apiKey: encryptedApiKey,
            isEnabled,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userAIConfig.userId, userId),
              eq(userAIConfig.providerName, providerName)
            )
          )
          .returning();
        return decryptConfig(updatedConfig);
      }

      const [newConfig] = await tx
        .insert(userAIConfig)
        .values({
          userId,
          providerName,
          apiKey: encryptedApiKey,
          isEnabled,
        })
        .returning();
      return decryptConfig(newConfig);
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to upsert user AI config"
    );
  }
}

export async function deleteUserAIConfig({
  userId,
  providerName,
}: {
  userId: string;
  providerName: string;
}): Promise<UserAIConfig | null> {
  try {
    const [deletedConfig] = await db
      .delete(userAIConfig)
      .where(
        and(
          eq(userAIConfig.userId, userId),
          eq(userAIConfig.providerName, providerName)
        )
      )
      .returning();
    return deletedConfig ? decryptConfig(deletedConfig) : null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete user AI config"
    );
  }
}
