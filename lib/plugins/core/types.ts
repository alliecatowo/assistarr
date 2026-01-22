import type { Tool } from "ai";
import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";

// ============================================================================
// DISPLAYABLE MEDIA INTERFACES (Polymorphic UI Contracts)
// ============================================================================

export type MediaStatus =
  | "available"
  | "wanted"
  | "downloading"
  | "requested"
  | "missing"
  | "error";

export interface DisplayableMedia {
  // Required for polymorphic display
  title: string;
  posterUrl: string | null;
  mediaType: "movie" | "tv" | "episode";

  // Status is standardized across all services
  status?: MediaStatus;

  // Universal metadata
  year?: number;
  overview?: string;
  rating?: number;
  genres?: string[];

  // Context-specific actions can use this ID
  serviceId: string | number;
}

// ============================================================================
// PLUGIN SYSTEM INTERFACES
// ============================================================================

export interface ToolFactoryProps {
  session: Session;
  config: ServiceConfig;
  pluginContext?: unknown; // For future extensibility
}

// biome-ignore lint/suspicious/noExplicitAny: Tool generic requires any
export type ToolFactory = (props: ToolFactoryProps) => Tool<any, any>;

export interface ToolMetadata {
  /**
   * High-level usage instructions for the AI.
   * Explains when and how to use this tool effectively.
   */
  usage?: string;

  /**
   * Example calls or prompts that this tool handles well.
   * Useful for few-shot prompting.
   */
  examples?: string[];
}

export interface ToolDefinition {
  factory: ToolFactory;
  displayName: string;
  description: string;
  category: ToolCategory;
  requiresApproval?: boolean;
  metadata?: {
    usage?: string;
    examples?: string[];
  };
}

export type ToolCategory =
  | "search"
  | "library"
  | "download"
  | "queue"
  | "calendar"
  | "management"
  | "system";

export interface ServicePlugin {
  // Metadata
  name: string;
  displayName: string;
  description: string;
  iconId: string; // Used for UI icons (e.g., 'radarr', 'sonarr')

  // Capabilities
  tools: Record<string, ToolDefinition>;

  // Lifecycle & Health
  healthCheck(config: ServiceConfig): Promise<boolean>;
  validateConfig?(
    config: ServiceConfig
  ): Promise<{ valid: boolean; error?: string }>;
}
