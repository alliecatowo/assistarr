import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";
import type { ServicePlugin } from "./types";

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
      // biome-ignore lint/suspicious/noConsole: Log warning
      console.warn(`Plugin ${plugin.name} is already registered. Overwriting.`);
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

  private shouldIncludeTool(
    mode: string | undefined,
    pluginName: string,
    toolName: string
  ): boolean {
    if (mode === "discover") {
      if (pluginName !== "jellyseerr") {
        return false;
      }
      return toolName === "searchContent" || toolName === "getDiscovery";
    }
    return true;
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
        if (this.shouldIncludeTool(mode, plugin.name, toolName)) {
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
