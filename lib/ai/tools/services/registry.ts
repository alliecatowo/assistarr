import type { Tool } from "ai";
import type { Session } from "next-auth";
import type { ServiceConfig } from "@/lib/db/schema";
import type { EnabledToolsResult, ServiceDefinition } from "./base";
import { jellyfinService } from "./jellyfin/definition";
import { jellyseerrService } from "./jellyseerr/definition";
import {
  registerServiceMetadata,
  registerToolsMetadata,
  SERVICE_BRAND_COLORS,
} from "./metadata";
import { qbittorrentService } from "./qbittorrent/definition";
// Import all service definitions
import { radarrService } from "./radarr/definition";
import { sonarrService } from "./sonarr/definition";

/**
 * Registry of all available services.
 * To add a new service:
 * 1. Create a definition.ts file in your service folder
 * 2. Export a ServiceDefinition object
 * 3. Import and add it to this array
 */
const serviceRegistry: ServiceDefinition[] = [
  radarrService,
  sonarrService,
  jellyfinService,
  jellyseerrService,
  qbittorrentService,
];

/**
 * Initialize the metadata registry from service definitions.
 * This runs once when the module is first imported.
 */
function initializeMetadataRegistry(): void {
  for (const service of serviceRegistry) {
    // Register service metadata
    registerServiceMetadata({
      name: service.name,
      displayName: service.displayName,
      iconId: service.iconId,
      brandColor: SERVICE_BRAND_COLORS[service.iconId],
    });

    // Register tool metadata
    const toolMetadata: Record<string, { displayName: string; category: any; description?: string; requiresApproval?: boolean }> = {};
    for (const [toolName, toolDef] of Object.entries(service.tools)) {
      toolMetadata[toolName] = {
        displayName: toolDef.displayName,
        category: toolDef.category,
        description: toolDef.description,
        requiresApproval: toolDef.requiresApproval,
      };
    }
    registerToolsMetadata(service.name, toolMetadata);
  }
}

// Initialize on module load
initializeMetadataRegistry();

/**
 * Get a service definition by name
 */
export function getService(name: string): ServiceDefinition | undefined {
  return serviceRegistry.find((service) => service.name === name);
}

/**
 * Get all registered service definitions
 */
export function getAllServices(): ServiceDefinition[] {
  return [...serviceRegistry];
}

/**
 * Get all service names
 */
export function getServiceNames(): string[] {
  return serviceRegistry.map((service) => service.name);
}

/**
 * Check if a service is enabled based on its configuration
 */
function isServiceEnabled(
  serviceName: string,
  configs: Map<string, ServiceConfig>
): boolean {
  const config = configs.get(serviceName);
  return config?.isEnabled === true;
}

/**
 * Get all enabled tools for the current session.
 * This function:
 * 1. Checks which services are enabled based on their configs
 * 2. Instantiates tools for enabled services
 * 3. Returns both the tool objects and their names
 *
 * @param session - The current user session
 * @param configs - Map of service names to their configurations
 * @returns Object containing tools map and tool names array
 */
export function getEnabledTools(
  session: Session,
  configs: Map<string, ServiceConfig>
): EnabledToolsResult {
  const tools: Record<string, Tool<any, any>> = {};
  const toolNames: string[] = [];

  for (const service of serviceRegistry) {
    // Skip services that aren't enabled
    if (!isServiceEnabled(service.name, configs)) {
      continue;
    }

    // Instantiate each tool for this service
    for (const [toolName, toolDef] of Object.entries(service.tools)) {
      tools[toolName] = toolDef.factory({ session });
      toolNames.push(toolName);
    }
  }

  return { tools, toolNames };
}

/**
 * Get tool names for a specific service
 */
export function getToolNamesForService(serviceName: string): string[] {
  const service = getService(serviceName);
  if (!service) {
    return [];
  }
  return Object.keys(service.tools);
}

/**
 * Perform health check on a service
 */
export async function checkServiceHealth(
  serviceName: string,
  config: ServiceConfig
): Promise<boolean> {
  const service = getService(serviceName);
  if (!service?.healthCheck) {
    // If no health check defined, assume healthy
    return true;
  }

  try {
    return await service.healthCheck({ config });
  } catch {
    return false;
  }
}

/**
 * Get enabled services from a configs map
 */
export function getEnabledServices(
  configs: Map<string, ServiceConfig>
): ServiceDefinition[] {
  return serviceRegistry.filter((service) =>
    isServiceEnabled(service.name, configs)
  );
}
