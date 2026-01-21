import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";
import type { SonarrHistoryResponse } from "./types";

type GetHistoryProps = {
  session: Session;
};

export const getHistory = ({ session }: GetHistoryProps) =>
  tool({
    description:
      "Get the download and import history from Sonarr. Shows past grabs, imports, failed downloads, and other events. Can be filtered by series or season.",
    inputSchema: z.object({
      seriesId: z
        .number()
        .optional()
        .describe("Optional: Filter history for a specific series"),
      seasonNumber: z
        .number()
        .optional()
        .describe(
          "Optional: Filter history for a specific season (requires seriesId)"
        ),
      pageSize: z
        .number()
        .optional()
        .default(20)
        .describe(
          "Number of history records to return (default: 20, max: 100)"
        ),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "get history" },
      async ({ seriesId, seasonNumber, pageSize }) => {
        const params = new URLSearchParams({
          page: "1",
          pageSize: Math.min(pageSize, 100).toString(),
          sortKey: "date",
          sortDirection: "descending",
          includeSeries: "true",
          includeEpisode: "true",
        });

        if (seriesId !== undefined) {
          params.append("seriesId", seriesId.toString());
        }
        if (seasonNumber !== undefined && seriesId !== undefined) {
          params.append("seasonNumber", seasonNumber.toString());
        }

        const history = await sonarrRequest<SonarrHistoryResponse>(
          session.user.id,
          `/history?${params.toString()}`
        );

        if (history.totalRecords === 0) {
          return {
            records: [],
            totalRecords: 0,
            message: "No history records found.",
          };
        }

        const records = history.records.map((record) => ({
          id: record.id,
          seriesTitle: record.series?.title ?? "Unknown Series",
          episodeTitle: record.episode?.title ?? "Unknown Episode",
          seasonNumber: record.episode?.seasonNumber,
          episodeNumber: record.episode?.episodeNumber,
          sourceTitle: record.sourceTitle,
          quality: record.quality.quality.name,
          eventType: record.eventType,
          date: record.date,
          downloadId: record.downloadId,
        }));

        return {
          records,
          totalRecords: history.totalRecords,
          message: `Found ${history.totalRecords} history record(s).`,
        };
      }
    ),
  });
