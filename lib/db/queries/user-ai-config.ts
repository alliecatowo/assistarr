import { and, eq } from "drizzle-orm";
import { decrypt, encrypt, isEncryptionConfigured } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import { type UserAIConfig, userAIConfig } from "../schema";
import { withTransaction } from "../utils";

const log = createLogger("db:user-ai-config");

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
    log.debug({ userId }, "Fetching user AI configs");
    const configs = await db
      .select()
      .from(userAIConfig)
      .where(eq(userAIConfig.userId, userId));
    return configs.map(decryptConfig);
  } catch (_error) {
    // If the preferredModelTier column does not exist (e.g., migration not applied),
    // try fetching without it and provide a default.
    // This is a temporary workaround until the migration is properly applied.
    if (
      _error instanceof Error &&
      _error.message.includes('column "preferredModelTier" does not exist')
    ) {
      log.warn(
        { userId },
        "Attempting to fetch user AI configs without preferredModelTier due to missing column"
      );
      try {
        const configsWithoutModelTier = await db
          .select({
            id: userAIConfig.id,
            userId: userAIConfig.userId,
            providerName: userAIConfig.providerName,
            apiKey: userAIConfig.apiKey,
            isEnabled: userAIConfig.isEnabled,
            createdAt: userAIConfig.createdAt,
            updatedAt: userAIConfig.updatedAt,
          })
          .from(userAIConfig)
          .where(eq(userAIConfig.userId, userId));

        // Manually add default preferredModelTier for compatibility
        return configsWithoutModelTier.map((config) =>
          decryptConfig({ ...config, preferredModelTier: "fast" })
        );
      } catch (retryError) {
        log.error(
          { error: retryError, userId },
          "Failed to get user AI configs even after retrying without preferredModelTier"
        );
        throw new ChatSDKError(
          "bad_request:database",
          "Failed to get user AI configs"
        );
      }
    }

    log.error({ error: _error, userId }, "Failed to get user AI configs");
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
    log.debug({ userId, providerName }, "Fetching user AI config");
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
    log.error(
      { error: _error, userId, providerName },
      "Failed to get user AI config"
    );
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
    log.debug({ userId }, "Fetching active user AI config");
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
    log.error({ error: _error, userId }, "Failed to get active user AI config");
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
    log.info({ userId, providerName, isEnabled }, "Upserting user AI config");
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
    log.error(
      { error: _error, userId, providerName },
      "Failed to upsert user AI config"
    );
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
    log.info({ userId, providerName }, "Deleting user AI config");
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
    log.error(
      { error: _error, userId, providerName },
      "Failed to delete user AI config"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete user AI config"
    );
  }
}

/**
 * Update the preferred model tier for a user's AI config
 */
export async function updateUserModelTier({
  userId,
  providerName,
  preferredModelTier,
}: {
  userId: string;
  providerName: string;
  preferredModelTier: "lite" | "fast" | "heavy" | "thinking";
}): Promise<UserAIConfig | null> {
  try {
    log.info(
      { userId, providerName, preferredModelTier },
      "Updating user model tier"
    );
    const [updatedConfig] = await db
      .update(userAIConfig)
      .set({
        preferredModelTier,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAIConfig.userId, userId),
          eq(userAIConfig.providerName, providerName)
        )
      )
      .returning();
    return updatedConfig ? decryptConfig(updatedConfig) : null;
  } catch (_error) {
    log.error(
      { error: _error, userId, providerName },
      "Failed to update user model tier"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user model tier"
    );
  }
}
