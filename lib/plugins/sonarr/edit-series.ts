import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrSeries } from "./types";

export const editSeries = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
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
        const currentSeries = await client.get<SonarrSeries>(
          `/series/${seriesId}`
        );

        const updatedSeriesBody = {
          ...currentSeries,
          monitored: monitored ?? currentSeries.monitored,
          qualityProfileId: qualityProfileId ?? currentSeries.qualityProfileId,
          path: rootFolderPath
            ? `${rootFolderPath}/${currentSeries.title}`
            : currentSeries.path,
          tags: tags ?? currentSeries.tags,
        };

        const result = await client.put<SonarrSeries>(
          `/series/${seriesId}`,
          updatedSeriesBody
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
        return {
          success: false,
          error: `Failed to edit series: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
