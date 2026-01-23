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
  runtime?: number;
  seasonCount?: number;
  monitored?: boolean;

  // External service identifiers
  externalIds?: {
    tmdb?: number;
    tvdb?: number;
    imdb?: string;
  };

  // Context-specific actions can use this ID (optional for discovery/search results)
  serviceId?: string | number;
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
  /**
   * Specifies which chat modes this tool is available in.
   * If undefined or empty, the tool is available in all modes.
   * Examples: ['chat'], ['chat', 'discover']
   */
  modes?: string[];
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

// ============================================================================
// BUNDLED CAPABILITIES (MCP Servers & Skills)
// ============================================================================

// Bundled MCP server definition
export interface BundledMCPServer {
  name: string;
  description: string;
  defaultUrl: string;
  transport: "sse" | "http";
}

// Bundled skill definition
export interface BundledSkill {
  name: string;
  displayName: string;
  description: string;
  instructions: string;
}

// Service plugin categories for settings UI organization
export type PluginCategory =
  | "media-server"
  | "arr-app"
  | "downloader"
  | "request-manager"
  | "other";

// ============================================================================
// SERVICE PLUGIN INTERFACE
// ============================================================================

export interface ServicePlugin {
  // Metadata
  name: string;
  displayName: string;
  description: string;
  iconId: string; // Used for UI icons (e.g., 'radarr', 'sonarr')
  category?: PluginCategory; // For settings UI organization

  // Capabilities
  tools: Record<string, ToolDefinition>;

  // Lifecycle & Health
  healthCheck(config: ServiceConfig): Promise<boolean>;
  validateConfig?(
    config: ServiceConfig
  ): Promise<{ valid: boolean; error?: string }>;

  // Bundled capabilities (optional)
  bundledMCPServers?: BundledMCPServer[];
  bundledSkills?: BundledSkill[];
}
