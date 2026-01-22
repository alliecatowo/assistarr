import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";
import { createLogger } from "@/lib/logger";
import type { ServicePlugin, ToolDefinition } from "./types";

const log = createLogger("plugin-manager");

export class PluginManager {
  private static instance: PluginManager;
  private readonly services: Map<string, ServicePlugin> = new Map();

  private constructor() {}

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  public register(plugin: ServicePlugin) {
    if (this.services.has(plugin.name)) {
      log.warn(
        { pluginName: plugin.name },
        "Plugin is already registered. Overwriting."
      );
    }
    this.services.set(plugin.name, plugin);
  }

  public getService(name: string): ServicePlugin | undefined {
    return this.services.get(name);
  }

  public getPlugins(): ServicePlugin[] {
    return Array.from(this.services.values());
  }

  public getAllServices(): ServicePlugin[] {
    return Array.from(this.services.values());
  }

  /**
   * Determines if a tool should be included based on the current chat mode.
   * Uses the tool's `modes` metadata for declarative filtering.
   *
   * @param mode - The current chat mode (e.g., "discover", "chat")
   * @param tool - The tool definition to check
   * @returns true if the tool should be included, false otherwise
   */
  private shouldIncludeTool(
    mode: string | undefined,
    tool: ToolDefinition
  ): boolean {
    // If no mode specified, include all tools
    if (!mode) {
      return true;
    }

    // If tool has no modes restriction, it's only available in default/chat mode
    if (!tool.modes || tool.modes.length === 0) {
      return mode === "chat" || mode === undefined;
    }

    // Check if the tool's modes include the current mode
    return tool.modes.includes(mode);
  }

  /**
   * Instantiates all enabled tools for the given session and configuration,
   * filtering based on the chat mode (e.g. "discover").
   */
  public getToolsForSession(
    session: Session,
    configs: Map<string, ServiceConfig>,
    mode?: string
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: Tools can be any type
    const tools: Record<string, any> = {};

    for (const plugin of this.services.values()) {
      const config = configs.get(plugin.name);
      if (!config?.isEnabled) {
        continue;
      }

      for (const [toolName, toolDef] of Object.entries(plugin.tools)) {
        if (this.shouldIncludeTool(mode, toolDef)) {
          tools[toolName] = toolDef.factory({
            session,
            config,
          });
        }
      }
    }

    return tools;
  }
}
