import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrCommand } from "./types";

export const searchMissingEpisodes = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Trigger a search for all missing monitored episodes in Sonarr. This will search indexers for every episode that is monitored but not yet downloaded.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const result = await client.post<SonarrCommand>("/command", {
          name: "MissingEpisodeSearch",
        });

        return {
          success: true,
          commandId: result.id,
          message: `Search started for all missing episodes. Command ID: ${result.id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to search missing episodes: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
