import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const deleteSeries = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Delete a TV show from Sonarr. IMPORTANT: You must SEARCH for the series first to get the correct 'seriesId'.",
    inputSchema: z.object({
      seriesId: z
        .number()
        .describe(
          "The Sonarr series ID to delete (get this from getLibrary or searchSeries)"
        ),
      deleteFiles: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Whether to verify and delete the series files from disk (default: false)"
        ),
      addImportListExclusion: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Whether to exclude this series from import lists to prevent re-adding (default: false)"
        ),
    }),
    execute: async ({ seriesId, deleteFiles, addImportListExclusion }) => {
      try {
        await client.delete(`/series/${seriesId}`, {
          deleteFiles,
          addImportListExclusion,
        });

        return {
          success: true,
          message: `Successfully deleted series with ID ${seriesId}${deleteFiles ? " and its files" : ""}.`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to delete series: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
