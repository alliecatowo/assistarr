import { and, eq } from "drizzle-orm";
import { ChatSDKError } from "../../errors";
import { db } from "../db";
import { type ServiceConfig, serviceConfig } from "../schema";

export async function getServiceConfigs({
  userId,
}: {
  userId: string;
}): Promise<ServiceConfig[]> {
  try {
    return await db
      .select()
      .from(serviceConfig)
      .where(eq(serviceConfig.userId, userId));
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
    return config ?? null;
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
    const existingConfig = await getServiceConfig({ userId, serviceName });

    if (existingConfig) {
      const [updatedConfig] = await db
        .update(serviceConfig)
        .set({
          baseUrl,
          apiKey,
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
      return updatedConfig;
    }

    const [newConfig] = await db
      .insert(serviceConfig)
      .values({
        userId,
        serviceName,
        baseUrl,
        apiKey,
        isEnabled,
      })
      .returning();
    return newConfig;
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
    return deletedConfig ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete service config"
    );
  }
}
