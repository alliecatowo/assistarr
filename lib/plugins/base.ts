import type { ServiceConfig } from "@/lib/db/schema";
import type { ServicePlugin, ToolCategory, ToolDefinition } from "./core/types";

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
      // biome-ignore lint/suspicious/noConsole: Log error for debugging
      console.error(`[${this.name}] Health check failed:`, error);
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
    }
  ): ToolDefinition {
    return {
      factory,
      ...metadata,
    };
  }
}

export interface DisplayableMedia {
  title: string;
  posterUrl: string | null;
  mediaType: "movie" | "tv" | "episode";
  year?: number;
  overview?: string;
  rating?: number;
  genres?: string[];
  runtime?: number;
  seasonCount?: number;
  status: "available" | "wanted" | "downloading" | "requested" | "missing";
  monitored?: boolean;
  externalIds?: {
    tmdb?: number;
    tvdb?: number;
    imdb?: string;
  };
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
