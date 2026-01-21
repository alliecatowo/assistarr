import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";
import type { RadarrHistoryResponse } from "./types";

type GetHistoryProps = {
  session: Session;
};

export const getHistory = ({ session }: GetHistoryProps) =>
  tool({
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
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "get history" },
      async ({ movieId, pageSize, includeMovie }) => {
        const params = new URLSearchParams({
          page: "1",
          pageSize: String(Math.min(pageSize, 100)),
          sortKey: "date",
          sortDirection: "descending",
        });

        if (movieId) {
          params.append("movieId", String(movieId));
        }
        if (includeMovie) {
          params.append("includeMovie", "true");
        }

        const history = await radarrRequest<RadarrHistoryResponse>(
          session.user.id,
          `/history?${params.toString()}`
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
      }
    ),
  });

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
