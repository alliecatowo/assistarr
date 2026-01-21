import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "trigger search" },
      async ({ seriesId, seasonNumber, episodeIds }) => {
        let commandBody: Record<string, unknown> = {
          name: "SeriesSearch",
          seriesId,
        };

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
      }
    ),
  });
