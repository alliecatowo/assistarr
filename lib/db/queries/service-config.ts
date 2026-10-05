import { and, eq } from "drizzle-orm";
import { assertNotDemo, isDemoMode } from "@/lib/demo/mode";
import { demoServiceConfigs } from "@/lib/demo/service-configs";
import { type OpenedSecret, openSecret, sealSecret } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import { type ServiceConfig, serviceConfig } from "../schema";
import { withTransaction } from "../utils";

const log = createLogger("db:service-config");

function sealField(
  value: string | null | undefined,
  userId: string
): string | null {
  if (!value) {
    return null;
  }
  return sealSecret(value, userId);
}

function openField(
  value: string | null | undefined,
  userId: string
): OpenedSecret | null {
  if (!value) {
    return null;
  }
  return openSecret(value, userId);
}

function decryptServiceConfig(config: ServiceConfig): ServiceConfig {
  const apiKey = openField(config.apiKey, config.userId);
  const password = openField(config.password, config.userId);

  if (apiKey?.legacy || password?.legacy) {
    // Re-seal pre-v2 rows (plaintext or old ciphertext) in the background.
    upgradeLegacyRow(config, apiKey, password).catch((error) =>
      log.warn({ error, id: config.id }, "Failed to upgrade service config")
    );
  }

  return {
    ...config,
    apiKey: apiKey?.value ?? "",
    password: password?.value ?? null,
  };
}

async function upgradeLegacyRow(
  config: ServiceConfig,
  apiKey: OpenedSecret | null,
  password: OpenedSecret | null
): Promise<void> {
  await db
    .update(serviceConfig)
    .set({
      apiKey: sealField(apiKey?.value, config.userId) ?? "",
      password: sealField(password?.value, config.userId),
    })
    .where(eq(serviceConfig.id, config.id));
}

export async function getServiceConfigs({
  userId,
}: {
  userId: string;
}): Promise<ServiceConfig[]> {
  if (isDemoMode()) {
    return demoServiceConfigs(userId);
  }
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
  if (isDemoMode()) {
    return (
      demoServiceConfigs(userId).find((c) => c.serviceName === serviceName) ??
      null
    );
  }
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
  assertNotDemo();
  try {
    log.info(
      { userId, serviceName, baseUrl, isEnabled },
      "Upserting service config"
    );
    // For services like qBittorrent that use username/password instead of API key,
    // we need to ensure apiKey is never null (database constraint)
    const encryptedApiKey = sealField(apiKey, userId) ?? "";
    const encryptedPassword = sealField(password, userId);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: transaction handles many service config branches
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
  assertNotDemo();
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
