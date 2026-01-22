import { and, eq } from "drizzle-orm";
import { decrypt, encrypt } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { db } from "../db";
import { type ServiceConfig, serviceConfig } from "../schema";
import { withTransaction } from "../utils";

/**
 * Decrypts the apiKey field in a service config.
 * Returns a new object with the decrypted apiKey.
 */
function decryptServiceConfig(config: ServiceConfig): ServiceConfig {
  try {
    return {
      ...config,
      apiKey: decrypt(config.apiKey),
    };
  } catch (_error) {
    // If decryption fails, it might be legacy unencrypted data
    // Return the config as-is to allow migration
    return config;
  }
}

export async function getServiceConfigs({
  userId,
}: {
  userId: string;
}): Promise<ServiceConfig[]> {
  try {
    const configs = await db
      .select()
      .from(serviceConfig)
      .where(eq(serviceConfig.userId, userId));

    // Decrypt apiKey for each config
    return configs.map(decryptServiceConfig);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get service configs"
    );
  }
}

export async function getServiceConfig({
  userId,
  serviceName,
}: {
  userId: string;
  serviceName: string;
}): Promise<ServiceConfig | null> {
  try {
    const [config] = await db
      .select()
      .from(serviceConfig)
      .where(
        and(
          eq(serviceConfig.userId, userId),
          eq(serviceConfig.serviceName, serviceName)
        )
      );

    if (!config) {
      return null;
    }

    // Decrypt apiKey before returning
    return decryptServiceConfig(config);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get service config"
    );
  }
}

export async function upsertServiceConfig({
  userId,
  serviceName,
  baseUrl,
  apiKey,
  isEnabled = true,
}: {
  userId: string;
  serviceName: string;
  baseUrl: string;
  apiKey: string;
  isEnabled?: boolean;
}): Promise<ServiceConfig> {
  try {
    // Encrypt the apiKey before storing
    const encryptedApiKey = encrypt(apiKey);

    return await withTransaction(async (tx) => {
      // Check if config exists by querying directly (not using getServiceConfig
      // which would decrypt, which we don't need here)
      const [existingConfig] = await tx
        .select({ id: serviceConfig.id })
        .from(serviceConfig)
        .where(
          and(
            eq(serviceConfig.userId, userId),
            eq(serviceConfig.serviceName, serviceName)
          )
        );

      if (existingConfig) {
        const [updatedConfig] = await tx
          .update(serviceConfig)
          .set({
            baseUrl,
            apiKey: encryptedApiKey,
            isEnabled,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceConfig.userId, userId),
              eq(serviceConfig.serviceName, serviceName)
            )
          )
          .returning();

        // Return with decrypted apiKey for consistency
        return { ...updatedConfig, apiKey };
      }

      const [newConfig] = await tx
        .insert(serviceConfig)
        .values({
          userId,
          serviceName,
          baseUrl,
          apiKey: encryptedApiKey,
          isEnabled,
        })
        .returning();

      // Return with decrypted apiKey for consistency
      return { ...newConfig, apiKey };
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to upsert service config"
    );
  }
}

export async function deleteServiceConfig({
  userId,
  serviceName,
}: {
  userId: string;
  serviceName: string;
}): Promise<ServiceConfig | null> {
  try {
    const [deletedConfig] = await db
      .delete(serviceConfig)
      .where(
        and(
          eq(serviceConfig.userId, userId),
          eq(serviceConfig.serviceName, serviceName)
        )
      )
      .returning();

    if (!deletedConfig) {
      return null;
    }

    // Return with decrypted apiKey for consistency
    return decryptServiceConfig(deletedConfig);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete service config"
    );
  }
}
