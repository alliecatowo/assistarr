import type { Tool } from "ai";
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

  public getAllServices(): ServicePlugin[] {
    return Array.from(this.services.values());
  }

  /**
   * Instantiates all enabled tools for the given session and configuration.
   */
  public getEnabledTools(
    session: Session,
    configs: Map<string, ServiceConfig>
  ) {
    const tools: Record<string, Tool> = {};
    const toolNames: string[] = [];

    // Use registry's helper to get enabled services (which logic might need to be moved here later,
    // but for now we'll use the one that filters based on config)
    // Actually, let's keep it simple: Iterate all registered services, check config.

    for (const service of this.services.values()) {
      const config = configs.get(service.name);
      if (!config?.isEnabled) {
        continue;
      }

      for (const [toolName, toolDef] of Object.entries(service.tools)) {
        // Instantiate the tool
        tools[toolName] = toolDef.factory({ session, config });
        toolNames.push(toolName);
      }
    }

    return { tools, toolNames };
  }
}
