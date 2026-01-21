import type { ServiceConfig } from "@/lib/db/schema";
import { BaseServicePlugin } from "../base";
import type { ToolDefinition } from "../core/types";
import { JellyfinClient } from "./client";
import { getContinueWatching } from "./get-continue-watching";
import { getRecentlyAdded } from "./get-recently-added";
import { searchMedia } from "./search-media";

class JellyfinPlugin extends BaseServicePlugin {
  name = "jellyfin";
  displayName = "Jellyfin";
  description = "Media server and streaming";
  iconId = "jellyfin";

  protected toolsDefinitions: Record<string, ToolDefinition> = {
    searchMedia: this.defineTool(searchMedia, {
      displayName: "Search Media",
      description: "Search for titles in Jellyfin library",
      category: "search",
    }),
    getContinueWatching: this.defineTool(getContinueWatching, {
      displayName: "Continue Watching",
      description: "Get partially watched content",
      category: "library",
    }),
    getRecentlyAdded: this.defineTool(getRecentlyAdded, {
      displayName: "Recently Added",
      description: "Get recently added content",
      category: "library",
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    try {
      const client = new JellyfinClient(config);
      await client.getStatus();
      return true;
    } catch {
      return false;
    }
  }
}

export const jellyfinPlugin = new JellyfinPlugin();
