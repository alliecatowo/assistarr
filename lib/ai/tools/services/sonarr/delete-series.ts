import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";

type DeleteSeriesProps = {
  session: Session;
};

export const deleteSeries = ({ session }: DeleteSeriesProps) =>
  tool({
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
        await sonarrRequest(
          session.user.id,
          `/series/${seriesId}?deleteFiles=${deleteFiles}&addImportListExclusion=${addImportListExclusion}`,
          {
            method: "DELETE",
          }
        );

        return {
          success: true,
          message: `Successfully deleted series with ID ${seriesId}${deleteFiles ? " and its files" : ""}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to delete series. Please try again." };
      }
    },
  });
