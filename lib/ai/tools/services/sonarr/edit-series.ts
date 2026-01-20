import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type { SonarrSeries } from "./types";

type EditSeriesProps = {
  session: Session;
};

export const editSeries = ({ session }: EditSeriesProps) =>
  tool({
    description:
      "Edit a TV show in Sonarr. You can change the quality profile, monitored status, or root folder path. IMPORTANT: You must SEARCH for the series first to get its current details (like path and profileId) because you need to send the full series object back with updates.",
    inputSchema: z.object({
      seriesId: z
        .number()
        .describe(
          "The Sonarr series ID to edit (get this from getLibrary or searchSeries)"
        ),
      monitored: z
        .boolean()
        .optional()
        .describe("Whether the series should be monitored for new episodes"),
      qualityProfileId: z
        .number()
        .optional()
        .describe(
          "The new quality profile ID for the series (get valid IDs from getQualityProfiles)"
        ),
      rootFolderPath: z
        .string()
        .optional()
        .describe("The new root folder path (e.g. /tv)"),
      tags: z.array(z.number()).optional().describe("List of tag IDs to apply"),
    }),
    execute: async ({
      seriesId,
      monitored,
      qualityProfileId,
      rootFolderPath,
      tags,
    }) => {
      try {
        // 1. Get the current series first
        const currentSeries = await sonarrRequest<SonarrSeries>(
          session.user.id,
          `/series/${seriesId}`
        );

        // 2. Update fields
        const updatedSeriesBody = {
          ...currentSeries,
          monitored: monitored ?? currentSeries.monitored,
          qualityProfileId: qualityProfileId ?? currentSeries.qualityProfileId,
          path: rootFolderPath
            ? `${rootFolderPath}/${currentSeries.title}`
            : currentSeries.path, // Simplistic path update
          tags: tags ?? currentSeries.tags,
        };

        // 3. Send update
        const result = await sonarrRequest<SonarrSeries>(
          session.user.id,
          `/series/${seriesId}`,
          {
            method: "PUT",
            body: JSON.stringify(updatedSeriesBody),
          }
        );

        return {
          success: true,
          message: `Successfully updated series "${result.title}".`,
          series: {
            id: result.id,
            title: result.title,
            monitored: result.monitored,
            qualityProfileId: result.qualityProfileId,
            path: result.path,
          },
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to edit series. Please try again." };
      }
    },
  });
