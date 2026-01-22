import type { ServiceConfig } from "@/lib/db/schema";
import { createLogger, type Logger } from "@/lib/logger";
import type { ServicePlugin, ToolCategory, ToolDefinition } from "./core/types";

// Re-export for convenience
export type { DisplayableMedia } from "./core/types";

/**
 * Abstract base class for all Service Plugins.
 * Provides standard implementations for health checks and tool management.
 *
 * @template TConfig - The type of the configuration interface, usually ServiceConfig
 */
export abstract class BaseServicePlugin<
  TConfig extends ServiceConfig = ServiceConfig,
> implements ServicePlugin
{
  abstract name: string;
  abstract displayName: string;
  abstract description: string;
  abstract iconId: string;

  protected abstract toolsDefinitions: Record<string, ToolDefinition>;

  /**
   * Logger instance for this plugin.
   * Lazily initialized with the plugin name as context.
   */
  private _logger: Logger | null = null;
  protected get logger(): Logger {
    if (!this._logger) {
      this._logger = createLogger(this.name);
    }
    return this._logger;
  }

  get tools(): Record<string, ToolDefinition> {
    return this.toolsDefinitions;
  }

  /**
   * Default health check implementation.
   * Override this if the service requires complex health checks.
   */
  async healthCheck(config: TConfig): Promise<boolean> {
    try {
      if (!config.apiKey || !config.baseUrl) {
        return false;
      }
      return await this.performHealthCheck(config);
    } catch (error) {
      this.logger.error({ err: error }, "Health check failed");
      return false;
    }
  }

  /**
   * Specific implementation of the health check logic.
   * This is called by healthCheck() after basic validation.
   */
  protected abstract performHealthCheck(config: TConfig): Promise<boolean>;

  /**
   * Helper to define a tool with type safety.
   */
  protected defineTool(
    factory: ToolDefinition["factory"],
    metadata: {
      displayName: string;
      description: string;
      category: ToolCategory;
      requiresApproval?: boolean;
      modes?: string[];
      metadata?: {
        usage?: string;
        examples?: string[];
      };
    }
  ): ToolDefinition {
    return {
      factory,
      ...metadata,
    };
  }
}

export function deriveMediaStatus(
  hasFile: boolean,
  monitored: boolean
): "available" | "wanted" | "downloading" | "missing" {
  if (hasFile) {
    return "available";
  }
  if (monitored) {
    return "downloading"; // Simplified; could be 'wanted' or 'missing' depending on more nuanced logic
  }
  return "missing";
}
