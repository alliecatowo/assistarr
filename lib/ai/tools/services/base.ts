import type { Tool } from "ai";
import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";

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
   * Map of tool names to their factory functions
   * The keys will be used as the tool identifiers in the AI system
   */
  tools: Record<string, ToolFactory>;

  /**
   * Optional health check function to verify the service is reachable
   * Returns true if the service is healthy, false otherwise
   */
  healthCheck?: (props: HealthCheckProps) => Promise<boolean>;
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
