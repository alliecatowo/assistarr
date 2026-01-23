import type { Tool } from "ai";
import { createLogger } from "../logger";
import { getMCPTools, namespaceMCPTool } from "./client-manager";
import type { MCPClientWrapper, NamespacedMCPTool } from "./types";

const log = createLogger("mcp:tool-adapter");

/**
 * Adapts MCP tools to Vercel AI SDK tool format with namespacing.
 * Returns a record of tools keyed by namespaced name.
 */
export async function adaptMCPTools(
  wrapper: MCPClientWrapper,
  serverDisplayName: string
  // biome-ignore lint/suspicious/noExplicitAny: MCP Tool types are dynamically typed
): Promise<Record<string, Tool<any, any>>> {
  const mcpTools = await getMCPTools(wrapper);
  // biome-ignore lint/suspicious/noExplicitAny: MCP Tool types are dynamically typed
  const adaptedTools: Record<string, Tool<any, any>> = {};

  for (const [originalName, mcpTool] of Object.entries(mcpTools)) {
    const namespacedName = namespaceMCPTool(serverDisplayName, originalName);

    log.debug(
      { originalName, namespacedName, serverDisplayName },
      "Adapting MCP tool"
    );

    // The MCP tools from AI SDK should already be in the correct format
    // We just need to rename them with namespacing
    // biome-ignore lint/suspicious/noExplicitAny: MCP Tool types are dynamically typed
    adaptedTools[namespacedName] = mcpTool as Tool<any, any>;
  }

  return adaptedTools;
}

/**
 * Gets information about adapted MCP tools for display purposes.
 */
export async function getMCPToolsInfo(
  wrapper: MCPClientWrapper,
  serverDisplayName: string
): Promise<NamespacedMCPTool[]> {
  const mcpTools = await getMCPTools(wrapper);
  const toolsInfo: NamespacedMCPTool[] = [];

  for (const [originalName, mcpTool] of Object.entries(mcpTools)) {
    const tool = mcpTool as { description?: string; parameters?: object };
    toolsInfo.push({
      originalName,
      namespacedName: namespaceMCPTool(serverDisplayName, originalName),
      description: tool.description || "",
      serverName: serverDisplayName,
      inputSchema: tool.parameters,
    });
  }

  return toolsInfo;
}

/**
 * Merges tools from multiple MCP clients with conflict detection.
 * If a tool name already exists in the base tools, it will be skipped with a warning.
 */
export async function mergeMCPToolsWithBase(
  // biome-ignore lint/suspicious/noExplicitAny: Tools have varying generic types
  baseTools: Record<string, Tool<any, any>>,
  mcpWrappers: Array<{ wrapper: MCPClientWrapper; displayName: string }>
): Promise<{
  // biome-ignore lint/suspicious/noExplicitAny: Tools have varying generic types
  tools: Record<string, Tool<any, any>>;
  mcpToolCount: number;
  conflicts: string[];
}> {
  const mergedTools = { ...baseTools };
  const conflicts: string[] = [];
  let mcpToolCount = 0;

  for (const { wrapper, displayName } of mcpWrappers) {
    try {
      const adaptedTools = await adaptMCPTools(wrapper, displayName);

      for (const [name, tool] of Object.entries(adaptedTools)) {
        if (mergedTools[name]) {
          log.warn(
            { toolName: name, serverName: displayName },
            "Tool name conflict - skipping MCP tool"
          );
          conflicts.push(name);
        } else {
          mergedTools[name] = tool;
          mcpToolCount++;
        }
      }
    } catch (error) {
      log.error(
        { error, serverName: displayName },
        "Failed to adapt MCP tools from server"
      );
    }
  }

  log.info(
    {
      baseToolCount: Object.keys(baseTools).length,
      mcpToolCount,
      totalToolCount: Object.keys(mergedTools).length,
      conflictCount: conflicts.length,
    },
    "Merged MCP tools with base tools"
  );

  return { tools: mergedTools, mcpToolCount, conflicts };
}
