import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrHistoryResponse } from "./types";

export const getHistory = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get download and import history from Radarr. Shows grabbed downloads, successful imports, failures, and other events. Can filter by a specific movie.",
    inputSchema: z.object({
      movieId: z
        .number()
        .optional()
        .describe("Optional movie ID to filter history for a specific movie"),
      pageSize: z
        .number()
        .optional()
        .default(20)
        .describe("Number of history items to return (default: 20, max: 100)"),
      includeMovie: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include movie details in the response (default: true)"),
    }),
    execute: async ({ movieId, pageSize, includeMovie }) => {
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page: 1,
          pageSize: Math.min(pageSize, 100),
          sortKey: "date",
          sortDirection: "descending",
          includeMovie,
        };

        if (movieId) {
          params.movieId = movieId;
        }

        const history = await client.get<RadarrHistoryResponse>(
          "/history",
          params
        );

        if (history.totalRecords === 0) {
          return {
            records: [],
            totalRecords: 0,
            message: movieId
              ? "No history found for this movie."
              : "No history records found.",
          };
        }

        const records = history.records.map((record) => ({
          id: record.id,
          movieId: record.movieId,
          movieTitle: record.movie?.title ?? "Unknown",
          movieYear: record.movie?.year,
          sourceTitle: record.sourceTitle,
          quality: record.quality.quality.name,
          languages: record.languages.map((l) => l.name).join(", "),
          date: record.date,
          eventType: record.eventType,
          downloadId: record.downloadId,
          eventDescription: getEventDescription(record.eventType),
        }));

        return {
          records,
          totalRecords: history.totalRecords,
          page: history.page,
          pageSize: history.pageSize,
          message: `Found ${history.totalRecords} history record(s).`,
        };
      } catch (error) {
        return {
          records: [],
          totalRecords: 0,
          message: `Error getting history: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function getEventDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    grabbed: "Release grabbed for download",
    downloadFolderImported: "Download imported successfully",
    downloadFailed: "Download failed",
    movieFileDeleted: "Movie file deleted",
    movieFolderImported: "Movie folder imported",
    movieFileRenamed: "Movie file renamed",
    downloadIgnored: "Download ignored",
  };
  return descriptions[eventType] ?? eventType;
}
