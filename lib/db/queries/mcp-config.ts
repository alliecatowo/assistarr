import { and, eq } from "drizzle-orm";
import { assertNotDemo } from "@/lib/demo/mode";
import { openSecret, sealSecret } from "../../crypto";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import {
  type MCPServerConfig,
  type MCPToolInfo,
  mcpServerConfig,
} from "../schema";

const log = createLogger("db:mcp-config");

/**
 * Decrypts sensitive fields in an MCP config. Throws on a v2 value that does
 * not decrypt; pre-v2 rows are re-sealed in the background.
 */
function decryptMCPConfig(config: MCPServerConfig): MCPServerConfig {
  if (!config.apiKey) {
    return { ...config, apiKey: null };
  }
  const opened = openSecret(config.apiKey, config.userId);
  if (opened.legacy) {
    db.update(mcpServerConfig)
      .set({ apiKey: sealSecret(opened.value, config.userId) })
      .where(eq(mcpServerConfig.id, config.id))
      .catch((error) =>
        log.warn({ error, id: config.id }, "Failed to upgrade MCP config")
      );
  }
  return { ...config, apiKey: opened.value };
}

/** Encrypts an API key; throws if ENCRYPTION_KEY is not usable. */
function encryptApiKey(
  apiKey: string | null | undefined,
  userId: string
): string | null {
  if (!apiKey) {
    return null;
  }
  return sealSecret(apiKey, userId);
}

export async function getMCPConfigs({
  userId,
}: {
  userId: string;
}): Promise<MCPServerConfig[]> {
  try {
    log.debug({ userId }, "Fetching MCP configs");
    const configs = await db
      .select()
      .from(mcpServerConfig)
      .where(eq(mcpServerConfig.userId, userId));

    return configs.map(decryptMCPConfig);
  } catch (_error) {
    log.error({ error: _error, userId }, "Failed to get MCP configs");
    throw new ChatSDKError("bad_request:database", "Failed to get MCP configs");
  }
}

export async function getMCPConfig({
  userId,
  id,
}: {
  userId: string;
  id: string;
}): Promise<MCPServerConfig | null> {
  try {
    log.debug({ userId, id }, "Fetching MCP config");
    const [config] = await db
      .select()
      .from(mcpServerConfig)
      .where(
        and(eq(mcpServerConfig.userId, userId), eq(mcpServerConfig.id, id))
      );

    if (!config) {
      log.debug({ userId, id }, "MCP config not found");
      return null;
    }

    return decryptMCPConfig(config);
  } catch (_error) {
    log.error({ error: _error, userId, id }, "Failed to get MCP config");
    throw new ChatSDKError("bad_request:database", "Failed to get MCP config");
  }
}

export async function getMCPConfigByName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}): Promise<MCPServerConfig | null> {
  try {
    log.debug({ userId, name }, "Fetching MCP config by name");
    const [config] = await db
      .select()
      .from(mcpServerConfig)
      .where(
        and(eq(mcpServerConfig.userId, userId), eq(mcpServerConfig.name, name))
      );

    if (!config) {
      return null;
    }

    return decryptMCPConfig(config);
  } catch (_error) {
    log.error({ error: _error, userId, name }, "Failed to get MCP config");
    throw new ChatSDKError("bad_request:database", "Failed to get MCP config");
  }
}

export async function createMCPConfig({
  userId,
  name,
  url,
  transport = "sse",
  apiKey,
  headers,
  isEnabled = true,
}: {
  userId: string;
  name: string;
  url: string;
  transport?: "sse" | "http";
  apiKey?: string;
  headers?: Record<string, string>;
  isEnabled?: boolean;
}): Promise<MCPServerConfig> {
  assertNotDemo();
  try {
    log.info(
      { userId, name, url, transport, isEnabled },
      "Creating MCP config"
    );

    // Check for duplicate name
    const existing = await getMCPConfigByName({ userId, name });
    if (existing) {
      throw new ChatSDKError(
        "bad_request:validation",
        `MCP server with name "${name}" already exists`
      );
    }

    const encryptedApiKey = encryptApiKey(apiKey, userId);

    const [newConfig] = await db
      .insert(mcpServerConfig)
      .values({
        userId,
        name,
        url,
        transport,
        apiKey: encryptedApiKey,
        headers,
        isEnabled,
      })
      .returning();

    return { ...newConfig, apiKey: apiKey ?? null };
  } catch (_error) {
    if (_error instanceof ChatSDKError) {
      throw _error;
    }
    log.error({ error: _error, userId, name }, "Failed to create MCP config");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create MCP config"
    );
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple optional fields require individual checks
export async function updateMCPConfig({
  userId,
  id,
  name,
  url,
  transport,
  apiKey,
  headers,
  isEnabled,
  availableTools,
  lastHealthCheck,
}: {
  userId: string;
  id: string;
  name?: string;
  url?: string;
  transport?: "sse" | "http";
  apiKey?: string | null;
  headers?: Record<string, string> | null;
  isEnabled?: boolean;
  availableTools?: MCPToolInfo[] | null;
  lastHealthCheck?: Date | null;
}): Promise<MCPServerConfig | null> {
  assertNotDemo();
  try {
    log.info({ userId, id, name, url, isEnabled }, "Updating MCP config");

    // If name is changing, check for duplicates
    if (name) {
      const existing = await getMCPConfigByName({ userId, name });
      if (existing && existing.id !== id) {
        throw new ChatSDKError(
          "bad_request:validation",
          `MCP server with name "${name}" already exists`
        );
      }
    }

    const updateData: Partial<MCPServerConfig> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }
    if (url !== undefined) {
      updateData.url = url;
    }
    if (transport !== undefined) {
      updateData.transport = transport;
    }
    if (apiKey !== undefined) {
      updateData.apiKey = encryptApiKey(apiKey, userId);
    }
    if (headers !== undefined) {
      updateData.headers = headers;
    }
    if (isEnabled !== undefined) {
      updateData.isEnabled = isEnabled;
    }
    if (availableTools !== undefined) {
      updateData.availableTools = availableTools;
    }
    if (lastHealthCheck !== undefined) {
      updateData.lastHealthCheck = lastHealthCheck;
    }

    const [updatedConfig] = await db
      .update(mcpServerConfig)
      .set(updateData)
      .where(
        and(eq(mcpServerConfig.userId, userId), eq(mcpServerConfig.id, id))
      )
      .returning();

    if (!updatedConfig) {
      return null;
    }

    return decryptMCPConfig(updatedConfig);
  } catch (_error) {
    if (_error instanceof ChatSDKError) {
      throw _error;
    }
    log.error({ error: _error, userId, id }, "Failed to update MCP config");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update MCP config"
    );
  }
}

export async function deleteMCPConfig({
  userId,
  id,
}: {
  userId: string;
  id: string;
}): Promise<MCPServerConfig | null> {
  assertNotDemo();
  try {
    log.info({ userId, id }, "Deleting MCP config");
    const [deletedConfig] = await db
      .delete(mcpServerConfig)
      .where(
        and(eq(mcpServerConfig.userId, userId), eq(mcpServerConfig.id, id))
      )
      .returning();

    if (!deletedConfig) {
      return null;
    }

    return decryptMCPConfig(deletedConfig);
  } catch (_error) {
    log.error({ error: _error, userId, id }, "Failed to delete MCP config");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete MCP config"
    );
  }
}

export async function getEnabledMCPConfigs({
  userId,
}: {
  userId: string;
}): Promise<MCPServerConfig[]> {
  try {
    log.debug({ userId }, "Fetching enabled MCP configs");
    const configs = await db
      .select()
      .from(mcpServerConfig)
      .where(
        and(
          eq(mcpServerConfig.userId, userId),
          eq(mcpServerConfig.isEnabled, true)
        )
      );

    return configs.map(decryptMCPConfig);
  } catch (_error) {
    log.error({ error: _error, userId }, "Failed to get enabled MCP configs");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get enabled MCP configs"
    );
  }
}
