import type { Tool } from "ai";
import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";
import type { ServiceIconId, ToolCategory, ToolMetadata } from "./metadata";

// ============================================================================
// DISPLAYABLE MEDIA INTERFACES
// These are the standard interfaces that ALL media-returning tools must use.
// Services provide complete display-ready data - no separate API calls needed.
// ============================================================================

/**
 * Standard interface that ALL media-returning tools must satisfy.
 * Services provide complete display-ready data.
 */
export interface DisplayableMedia {
  // Required for display
  title: string;
  posterUrl: string | null; // FULL URL from service
  mediaType: "movie" | "tv" | "episode";

  // Rich metadata (all optional)
  year?: number;
  overview?: string;
  rating?: number;
  genres?: string[];
  runtime?: number;
  seasonCount?: number; // For TV

  // Status for UI rendering
  status?: "available" | "wanted" | "downloading" | "requested" | "missing";
  hasFile?: boolean;
  monitored?: boolean;

  // Service-specific IDs (for actions, not display)
  serviceId?: number | string;
  externalIds?: {
    tmdb?: number;
    tvdb?: number;
    imdb?: string;
    jellyfin?: string;
  };
}

/**
 * What add-movie/add-series tools should include for approval UI.
 */
export interface AddMediaRequest {
  media: DisplayableMedia;
  qualityProfile?: { id: number; name: string };
  rootFolder?: string;
  monitor?: string;
  searchOnAdd?: boolean;
}

/**
 * Helper to derive display status from Radarr/Sonarr fields
 */
export function deriveMediaStatus(
  hasFile?: boolean,
  monitored?: boolean,
  isAvailable?: boolean,
  isPending?: boolean
): DisplayableMedia["status"] {
  if (isAvailable || hasFile) return "available";
  if (isPending) return "requested";
  if (monitored) return "wanted";
  return "missing";
}

/**
 * Props passed to tool factory functions
 */
export interface ToolFactoryProps {
  session: Session;
}

/**
 * A factory function that creates a tool instance.
 * Uses `any` for generic parameters since tools have varying input/output types
 * and TypeScript's variance rules prevent using `unknown` in this context.
 */
export type ToolFactory = (props: ToolFactoryProps) => Tool<any, any>;

/**
 * Props for health check functions
 */
export interface HealthCheckProps {
  config: ServiceConfig;
}

/**
 * Tool definition that pairs a factory with its metadata
 */
export interface ToolDefinition {
  /** Factory function to create the tool */
  factory: ToolFactory;
  /** Human-readable display name */
  displayName: string;
  /** Category for grouping in UI */
  category: ToolCategory;
  /** Brief description for tooltips */
  description?: string;
  /** Whether this tool requires approval */
  requiresApproval?: boolean;
}

/**
 * Helper to create a tool definition with metadata
 */
export function defineTool(
  factory: ToolFactory,
  metadata: ToolMetadata
): ToolDefinition {
  return { factory, ...metadata };
}

/**
 * Defines a service that can be registered with the plugin system.
 * Each service represents an external application (e.g., Radarr, Sonarr)
 * and exposes a set of tools that interact with that application.
 */
export interface ServiceDefinition {
  /**
   * Unique identifier for the service (e.g., 'radarr', 'sonarr')
   * This should match the serviceName stored in the database
   */
  name: string;

  /**
   * Human-readable name for display purposes (e.g., 'Radarr', 'Sonarr')
   */
  displayName: string;

  /**
   * Description of what the service does
   */
  description: string;

  /**
   * Icon identifier for the polymorphic icon system
   */
  iconId: ServiceIconId;

  /**
   * Map of tool names to their definitions (factory + metadata)
   * The keys will be used as the tool identifiers in the AI system
   */
  tools: Record<string, ToolDefinition>;

  /**
   * Optional health check function to verify the service is reachable
   * Returns true if the service is healthy, false otherwise
   */
  healthCheck?: (props: HealthCheckProps) => Promise<boolean>;
}

/**
 * Health check configuration for different authentication types
 */
export type HealthCheckConfig =
  | { type: "api-key-header"; endpoint: string; headerName: string }
  | { type: "bearer-token"; endpoint: string; tokenTemplate: string }
  | { type: "basic-auth"; endpoint: string }
  | { type: "form-login"; endpoint: string; successResponse: string };

/**
 * Create a health check function from configuration.
 * Reduces boilerplate in service definitions by handling common patterns.
 */
export function createHealthCheck(
  config: HealthCheckConfig
): (props: HealthCheckProps) => Promise<boolean> {
  return async ({ config: serviceConfig }) => {
    try {
      const baseUrl = serviceConfig.baseUrl.replace(/\/$/, "");

      switch (config.type) {
        case "api-key-header": {
          const response = await fetch(`${baseUrl}${config.endpoint}`, {
            headers: { [config.headerName]: serviceConfig.apiKey },
          });
          return response.ok;
        }

        case "bearer-token": {
          const token = config.tokenTemplate.replace(
            "{apiKey}",
            serviceConfig.apiKey
          );
          const response = await fetch(`${baseUrl}${config.endpoint}`, {
            headers: { Authorization: token },
          });
          return response.ok;
        }

        case "basic-auth": {
          const credentials = Buffer.from(serviceConfig.apiKey).toString(
            "base64"
          );
          const response = await fetch(`${baseUrl}${config.endpoint}`, {
            headers: { Authorization: `Basic ${credentials}` },
          });
          return response.ok;
        }

        case "form-login": {
          const colonIndex = serviceConfig.apiKey.indexOf(":");
          if (colonIndex === -1) {
            return false;
          }

          const username = serviceConfig.apiKey.substring(0, colonIndex);
          const password = serviceConfig.apiKey.substring(colonIndex + 1);

          const response = await fetch(`${baseUrl}${config.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username, password }),
          });

          const text = await response.text();
          return text === config.successResponse;
        }
      }
    } catch {
      return false;
    }
  };
}

/**
 * Result of getEnabledTools containing tools and their names
 */
export interface EnabledToolsResult {
  /**
   * Map of tool names to instantiated tool objects
   */
  tools: Record<string, Tool<any, any>>;

  /**
   * Array of tool names that are enabled
   */
  toolNames: string[];
}

/**
 * Configuration for the service registry
 */
export interface ServiceRegistryConfig {
  /**
   * Map of service names to their configurations
   */
  configs: Map<string, ServiceConfig>;

  /**
   * The session to pass to tool factories
   */
  session: Session;
}
