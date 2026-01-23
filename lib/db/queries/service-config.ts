import { and, eq } from "drizzle-orm";
import { decrypt, encrypt, isEncryptionConfigured } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import { type ServiceConfig, serviceConfig } from "../schema";
import { withTransaction } from "../utils";

const log = createLogger("db:service-config");

function decryptField(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  if (!isEncryptionConfigured()) {
    return value;
  }
  try {
    return decrypt(value) ?? "";
  } catch {
    return value;
  }
}

function encryptField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (!isEncryptionConfigured()) {
    return value;
  }
  return encrypt(value);
}

function decryptServiceConfig(config: ServiceConfig): ServiceConfig {
  return {
    ...config,
    apiKey: decryptField(config.apiKey) ?? "",
    password: decryptField(config.password),
  };
}

export async function getServiceConfigs({
  userId,
}: {
  userId: string;
}): Promise<ServiceConfig[]> {
  try {
    log.debug({ userId }, "Fetching service configs");
    const configs = await db
      .select()
      .from(serviceConfig)
      .where(eq(serviceConfig.userId, userId));

    return configs.map(decryptServiceConfig);
  } catch (_error) {
    log.error({ error: _error, userId }, "Failed to get service configs");
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
    log.debug({ userId, serviceName }, "Fetching service config");
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
      log.debug({ userId, serviceName }, "Service config not found");
      return null;
    }

    return decryptServiceConfig(config);
  } catch (_error) {
    log.error(
      { error: _error, userId, serviceName },
      "Failed to get service config"
    );
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
  username,
  password,
  isEnabled = true,
}: {
  userId: string;
  serviceName: string;
  baseUrl: string;
  apiKey: string;
  username?: string | null;
  password?: string | null;
  isEnabled?: boolean;
}): Promise<ServiceConfig> {
  try {
    log.info(
      { userId, serviceName, baseUrl, isEnabled },
      "Upserting service config"
    );
    const encryptedApiKey = encryptField(apiKey);
    const encryptedPassword = encryptField(password);

    return await withTransaction(async (tx) => {
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
        const updateData: Record<string, unknown> = {
          baseUrl,
          apiKey: encryptedApiKey,
          isEnabled,
          updatedAt: new Date(),
        };
        if (username !== undefined) {
          updateData.username = username;
        }
        if (password !== undefined) {
          updateData.password = encryptedPassword;
        }

        const [updatedConfig] = await tx
          .update(serviceConfig)
          .set(updateData)
          .where(
            and(
              eq(serviceConfig.userId, userId),
              eq(serviceConfig.serviceName, serviceName)
            )
          )
          .returning();

        return {
          ...updatedConfig,
          apiKey: apiKey ?? "",
          username: username ?? null,
          password: password ?? null,
        };
      }

      const [newConfig] = await tx
        .insert(serviceConfig)
        .values({
          userId,
          serviceName,
          baseUrl,
          apiKey: encryptedApiKey ?? "",
          username: username ?? null,
          password: encryptedPassword,
          isEnabled,
        })
        .returning();

      return {
        ...newConfig,
        apiKey: apiKey ?? "",
        username: username ?? null,
        password: password ?? null,
      };
    });
  } catch (_error) {
    log.error(
      { error: _error, userId, serviceName },
      "Failed to upsert service config"
    );
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
    log.info({ userId, serviceName }, "Deleting service config");
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

    return decryptServiceConfig(deletedConfig);
  } catch (_error) {
    log.error(
      { error: _error, userId, serviceName },
      "Failed to delete service config"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete service config"
    );
  }
}
