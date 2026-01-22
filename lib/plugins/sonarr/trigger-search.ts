import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const triggerSearch = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Trigger a new search for a series in Sonarr. You can search for the entire series, specific seasons, or episodes. IMPORTANT: You must search for the series first to get the correct 'seriesId'.",
    inputSchema: z.object({
      seriesId: z.number().describe("The Sonarr series ID to search for"),
      seasonNumber: z
        .number()
        .optional()
        .describe(
          "Optional: The season number to search for. If omitted along with episodeNumber, searches entire series."
        ),
      episodeIds: z
        .array(z.number())
        .optional()
        .describe("Optional: List of episode IDs to search for."),
    }),
    execute: async ({ seriesId, seasonNumber, episodeIds }) => {
      let commandBody: Record<string, unknown> = {
        name: "SeriesSearch",
        seriesId,
      };

      if (episodeIds && episodeIds.length > 0) {
        commandBody = { name: "EpisodeSearch", episodeIds };
      } else if (seasonNumber !== undefined) {
        commandBody = { name: "SeasonSearch", seriesId, seasonNumber };
      }

      await client.post("/command", commandBody);

      return {
        success: true,
        message: `Search triggered for series ID ${seriesId}${seasonNumber !== undefined ? ` season ${seasonNumber}` : ""}${episodeIds ? ` episodes ${episodeIds.join(",")}` : ""}.`,
      };
    },
  });
};
