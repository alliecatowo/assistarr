import type { ServiceConfig } from "@/lib/db/schema";
import { BaseServicePlugin } from "../base";
import type { ToolDefinition } from "../core/types";
import { JellyseerrClient } from "./client";
import { deleteRequest } from "./delete-request";
import { getDiscovery } from "./get-discovery";
import { getRequests } from "./get-requests";
import { requestMedia } from "./request-media";
import { searchContent } from "./search-content";

export class JellyseerrPlugin extends BaseServicePlugin {
  name = "jellyseerr";
  displayName = "Jellyseerr";
  description = "Request management and content discovery";
  iconId = "jellyseerr";

  protected toolsDefinitions: Record<string, ToolDefinition> = {
    searchContent: this.defineTool(searchContent, {
      displayName: "Search Content",
      description: "Search for movies and TV shows to request",
      category: "search",
      modes: ["chat", "discover"],
    }),
    getDiscovery: this.defineTool(getDiscovery, {
      displayName: "Discover Content",
      description: "Get trending and popular content",
      category: "search",
      modes: ["chat", "discover"],
    }),
    getRequests: this.defineTool(getRequests, {
      displayName: "Get Requests",
      description: "View media requests and their status",
      category: "management",
      modes: ["chat"],
    }),
    requestMedia: this.defineTool(requestMedia, {
      displayName: "Request Media",
      description: "Request movies and TV shows",
      category: "library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    deleteRequest: this.defineTool(deleteRequest, {
      displayName: "Delete Request",
      description: "Cancel/delete a pending request",
      category: "management",
      requiresApproval: true,
      modes: ["chat"],
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    try {
      const client = new JellyseerrClient(config);
      await client.getStatus();
      return true;
    } catch {
      return false;
    }
  }
}

export const jellyseerrPlugin = new JellyseerrPlugin();
