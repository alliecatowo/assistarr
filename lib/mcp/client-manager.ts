import { createLogger } from "../logger";
import type {
  MCPClientOptions,
  MCPClientWrapper,
  MCPDiscoveryResult,
  MCPHealthCheckResult,
  MCPToolInfo,
} from "./types";

const log = createLogger("mcp:client-manager");

/**
 * Dynamically imports the MCP client.
 * This allows the app to work even if @ai-sdk/mcp is not installed.
 */
async function getMCPClientModule() {
  try {
    const module = await import("@ai-sdk/mcp");
    return module;
  } catch (error) {
    log.error({ error }, "Failed to import @ai-sdk/mcp - MCP support disabled");
    throw new Error(
      "MCP support requires @ai-sdk/mcp package. Install with: pnpm add @ai-sdk/mcp"
    );
  }
}

/**
 * Creates an MCP client for a single request lifecycle.
 * The client should be closed after the request completes.
 */
export async function createMCPClientWrapper(
  options: MCPClientOptions
): Promise<MCPClientWrapper> {
  const { createMCPClient } = await getMCPClientModule();

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  log.debug(
    { url: options.url, transport: options.transport },
    "Creating MCP client"
  );

  const client = await createMCPClient({
    transport: {
      type: options.transport,
      url: options.url,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    },
  });

  return {
    client,
    serverName: extractServerName(options.url),
    close: async () => {
      try {
        await client.close();
        log.debug({ url: options.url }, "MCP client closed");
      } catch (error) {
        log.error({ error, url: options.url }, "Error closing MCP client");
      }
    },
  };
}

/**
 * Discovers available tools from an MCP server.
 */
export async function discoverMCPTools(
  options: MCPClientOptions
): Promise<MCPDiscoveryResult> {
  const wrapper = await createMCPClientWrapper(options);

  try {
    const tools = await wrapper.client.tools();

    // Convert to MCPToolInfo format
    const toolInfos: MCPToolInfo[] = Object.entries(tools).map(
      ([name, tool]: [string, any]) => ({
        name,
        description: tool.description || "",
        inputSchema: tool.parameters,
      })
    );

    log.info(
      { url: options.url, toolCount: toolInfos.length },
      "Discovered MCP tools"
    );

    return {
      tools: toolInfos,
      serverName: wrapper.serverName,
    };
  } finally {
    await wrapper.close();
  }
}

/**
 * Tests connectivity to an MCP server.
 */
export async function checkMCPHealth(
  options: MCPClientOptions
): Promise<MCPHealthCheckResult> {
  const startTime = Date.now();

  try {
    const discovery = await discoverMCPTools(options);
    const latency = Date.now() - startTime;

    return {
      success: true,
      latency,
      tools: discovery.tools,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error({ error, url: options.url }, "MCP health check failed");

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Gets tools from an MCP client wrapper.
 * Returns the raw tools object for use with AI SDK.
 */
export async function getMCPTools(
  wrapper: MCPClientWrapper
): Promise<Record<string, any>> {
  return await wrapper.client.tools();
}

/**
 * Extracts a clean server name from a URL for namespacing.
 */
function extractServerName(url: string): string {
  try {
    const parsed = new URL(url);
    // Use hostname without port, replacing dots with underscores
    return parsed.hostname.replace(/\./g, "_");
  } catch {
    // Fallback for invalid URLs
    return "unknown";
  }
}

/**
 * Sanitizes a name for use in tool namespacing.
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Creates a namespaced tool name to avoid conflicts.
 * Format: mcp_{serverName}_{toolName}
 */
export function namespaceMCPTool(serverName: string, toolName: string): string {
  return `mcp_${sanitizeName(serverName)}_${sanitizeName(toolName)}`;
}
