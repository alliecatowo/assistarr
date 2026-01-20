/**
 * Tool Metadata System
 *
 * This module provides a centralized, polymorphic approach to tool metadata.
 * Instead of hardcoding display names in message.tsx, tools define their own
 * metadata which is aggregated and exposed through the registry.
 *
 * IMPORTANT: This module uses static definitions that work on both server
 * and client side. The tool display names are defined inline to ensure
 * they're available during SSR and client hydration.
 */

/**
 * Categories of tools for grouping in UI
 */
export type ToolCategory =
  | "search"
  | "library"
  | "queue"
  | "calendar"
  | "download"
  | "request"
  | "discovery"
  | "playback"
  | "management"
  | "history"
  | "blocklist"
  | "import";

/**
 * Metadata for a single tool, defined alongside the tool implementation
 */
export interface ToolMetadata {
  /** Human-readable display name (e.g., "Search Movies") */
  displayName: string;
  /** Category for grouping tools */
  category: ToolCategory;
  /** Brief description for tooltips or help text */
  description?: string;
  /** Whether this tool requires user approval before execution */
  requiresApproval?: boolean;
}

/**
 * Extended service metadata including icon configuration
 */
export interface ServiceMetadata {
  /** Unique identifier matching ServiceDefinition.name */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Icon identifier for the polymorphic icon system */
  iconId: ServiceIconId;
  /** Service color for branding (CSS color value) */
  brandColor?: string;
}

/**
 * Icon identifiers for supported services.
 * Using string identifiers allows for lazy-loading and polymorphic rendering.
 */
export type ServiceIconId =
  | "radarr"
  | "sonarr"
  | "jellyfin"
  | "jellyseerr"
  | "qbittorrent"
  | "plex"
  | "emby"
  | "generic";

/**
 * Service brand colors for consistent theming
 */
export const SERVICE_BRAND_COLORS: Record<ServiceIconId, string> = {
  radarr: "#ffc230",
  sonarr: "#00ccff",
  jellyfin: "#00a4dc",
  jellyseerr: "#7b2fda",
  qbittorrent: "#2f67ba",
  plex: "#e5a00d",
  emby: "#52b54b",
  generic: "#6b7280",
};

/**
 * Static tool display names - defined here for client-side availability.
 * This is the source of truth for tool display names across the application.
 *
 * When adding a new tool:
 * 1. Add the tool to the service definition with defineTool()
 * 2. Add the display name entry here
 */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  // Radarr
  searchRadarrMovies: "Search Movies (Radarr)",
  addRadarrMovie: "Add Movie",
  editRadarrMovie: "Edit Movie",
  deleteRadarrMovie: "Delete Movie",
  triggerRadarrSearch: "Search Downloads (Radarr)",
  refreshRadarrMovie: "Refresh Movie (Radarr)",
  getRadarrLibrary: "Get Library (Radarr)",
  getRadarrQualityProfiles: "List Quality Profiles (Radarr)",
  getRadarrQueue: "View Queue (Radarr)",
  getRadarrCalendar: "View Calendar (Radarr)",
  getRadarrReleases: "Get Releases (Radarr)",
  grabRadarrRelease: "Grab Release (Radarr)",
  removeFromRadarrQueue: "Remove from Queue (Radarr)",
  getRadarrManualImport: "Get Manual Import (Radarr)",
  executeRadarrManualImport: "Execute Manual Import (Radarr)",
  scanRadarrDownloadedMovies: "Scan Downloaded Movies (Radarr)",
  getRadarrMovieFiles: "Get Movie Files (Radarr)",
  renameRadarrMovieFiles: "Rename Movie Files (Radarr)",
  deleteRadarrMovieFile: "Delete Movie File (Radarr)",
  getRadarrHistory: "Get History (Radarr)",
  markRadarrFailed: "Mark Failed (Radarr)",
  getRadarrBlocklist: "Get Blocklist (Radarr)",
  deleteRadarrBlocklist: "Remove from Blocklist (Radarr)",
  // Sonarr
  getSonarrLibrary: "Get Library (Sonarr)",
  getSonarrQualityProfiles: "List Quality Profiles (Sonarr)",
  getSonarrQueue: "View Queue (Sonarr)",
  getSonarrCalendar: "View Calendar (Sonarr)",
  searchSonarrSeries: "Search TV (Sonarr)",
  getSonarrReleases: "Get Releases (Sonarr)",
  getSonarrHistory: "View History (Sonarr)",
  getSonarrBlocklist: "View Blocklist (Sonarr)",
  getSonarrEpisodeFiles: "Get Episode Files (Sonarr)",
  getSonarrManualImport: "Get Manual Import (Sonarr)",
  addSonarrSeries: "Add Series",
  editSonarrSeries: "Edit Series",
  deleteSonarrSeries: "Delete Series",
  triggerSonarrSearch: "Search Downloads (Sonarr)",
  refreshSonarrSeries: "Refresh Series (Sonarr)",
  grabSonarrRelease: "Grab Release (Sonarr)",
  removeFromSonarrQueue: "Remove from Queue (Sonarr)",
  executeSonarrManualImport: "Execute Manual Import (Sonarr)",
  scanSonarrDownloadedEpisodes: "Scan Downloaded Episodes (Sonarr)",
  renameSonarrEpisodeFiles: "Rename Episode Files (Sonarr)",
  deleteSonarrEpisodeFile: "Delete Episode File (Sonarr)",
  markSonarrFailed: "Mark Failed (Sonarr)",
  deleteSonarrBlocklist: "Remove from Blocklist (Sonarr)",
  searchSonarrMissingEpisodes: "Search Missing Episodes (Sonarr)",
  // Jellyseerr
  searchContent: "Search Media (Jellyseerr)",
  requestMedia: "Request Media",
  getRequests: "View Requests",
  deleteRequest: "Delete Request",
  getDiscovery: "Discover Content",
  // qBittorrent
  getTorrents: "View Torrents",
  getTransferInfo: "Transfer Stats",
  pauseResumeTorrent: "Control Torrent",
  // Jellyfin
  getContinueWatching: "Continue Watching (Jellyfin)",
  getRecentlyAdded: "Recently Added (Jellyfin)",
  searchJellyfinMedia: "Search Media (Jellyfin)",
};

/**
 * Service metadata registry - populated by service definitions
 */
const serviceMetadataRegistry = new Map<string, ServiceMetadata>();

/**
 * Tool metadata registry - maps tool names to their metadata
 */
const toolMetadataRegistry = new Map<
  string,
  ToolMetadata & { serviceName: string }
>();

/**
 * Register service metadata
 */
export function registerServiceMetadata(metadata: ServiceMetadata): void {
  serviceMetadataRegistry.set(metadata.name, metadata);
}

/**
 * Register tool metadata for a service
 */
export function registerToolMetadata(
  serviceName: string,
  toolName: string,
  metadata: ToolMetadata
): void {
  toolMetadataRegistry.set(toolName, { ...metadata, serviceName });
}

/**
 * Batch register tool metadata for a service
 */
export function registerToolsMetadata(
  serviceName: string,
  tools: Record<string, ToolMetadata>
): void {
  for (const [toolName, metadata] of Object.entries(tools)) {
    registerToolMetadata(serviceName, toolName, metadata);
  }
}

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(
  toolName: string
): (ToolMetadata & { serviceName: string }) | undefined {
  return toolMetadataRegistry.get(toolName);
}

/**
 * Get display name for a tool, falling back to the raw tool name.
 * Uses the static TOOL_DISPLAY_NAMES for client-side rendering.
 */
export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] ?? toolName;
}

/**
 * Get all registered tool metadata as a record
 */
export function getAllToolMetadata(): Record<
  string,
  ToolMetadata & { serviceName: string }
> {
  return Object.fromEntries(toolMetadataRegistry);
}

/**
 * Get service metadata
 */
export function getServiceMetadata(
  serviceName: string
): ServiceMetadata | undefined {
  return serviceMetadataRegistry.get(serviceName);
}

/**
 * Get all service metadata
 */
export function getAllServiceMetadata(): ServiceMetadata[] {
  return Array.from(serviceMetadataRegistry.values());
}

/**
 * Get the service name for a given tool
 */
export function getServiceForTool(toolName: string): string | undefined {
  return toolMetadataRegistry.get(toolName)?.serviceName;
}

/**
 * Check if a tool requires approval
 */
export function toolRequiresApproval(toolName: string): boolean {
  return toolMetadataRegistry.get(toolName)?.requiresApproval ?? false;
}
