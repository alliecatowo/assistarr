import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";

type TriggerSearchProps = {
  session: Session;
};

export const triggerSearch = ({ session }: TriggerSearchProps) =>
  tool({
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
      try {
        let _commandName = "SeriesSearch";
        const _body: any = { seriesId };

        // Logic for different search commands in Sonarr
        if (episodeIds && episodeIds.length > 0) {
          _commandName = "EpisodeSearch";
          // EpisodeSearch takes episodeIds
          // SeriesSearch takes seriesId
          // SeasonSearch (if exists in v3) or just SeriesSearch with filtering?
          // Actually Sonarr v3 uses distinct commands.
          // Check API docs logic:
          // SeriesSearch: { seriesId }
          // EpisodeSearch: { episodeIds }
          // SeasonSearch: { seriesId, seasonNumber }
        }

        let commandBody: any = { name: "SeriesSearch", seriesId };

        if (episodeIds && episodeIds.length > 0) {
          commandBody = { name: "EpisodeSearch", episodeIds };
        } else if (seasonNumber !== undefined) {
          commandBody = { name: "SeasonSearch", seriesId, seasonNumber };
        }

        await sonarrRequest(session.user.id, "/command", {
          method: "POST",
          body: JSON.stringify(commandBody),
        });

        return {
          success: true,
          message: `Search triggered for series ID ${seriesId}${seasonNumber !== undefined ? ` season ${seasonNumber}` : ""}${episodeIds ? ` episodes ${episodeIds.join(",")}` : ""}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to trigger search. Please try again." };
      }
    },
  });
