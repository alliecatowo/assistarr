import { tool } from "ai";
import { z } from "zod";
import { invalidateUserCache } from "@/lib/cache/library-cache";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const deleteSeries = ({ session, config }: ToolFactoryProps) => {
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
      await client.delete(`/series/${seriesId}`, {
        deleteFiles,
        addImportListExclusion,
      });

      // Invalidate library cache so personalized recommendations update
      if (session.user?.id) {
        invalidateUserCache(session.user.id);
      }

      return {
        success: true,
        message: `Successfully deleted series with ID ${seriesId}${deleteFiles ? " and its files" : ""}.`,
      };
    },
  });
};
