import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrHistoryResponse } from "./types";

export const getHistory = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
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
    execute: async ({ seriesId, seasonNumber, pageSize }) => {
      try {
        const params: Record<string, string | number> = {
          page: 1,
          pageSize: Math.min(pageSize, 100),
          sortKey: "date",
          sortDirection: "descending",
          includeSeries: "true",
          includeEpisode: "true",
        };

        if (seriesId !== undefined) {
          params.seriesId = seriesId;
        }
        if (seasonNumber !== undefined && seriesId !== undefined) {
          params.seasonNumber = seasonNumber;
        }

        const history = await client.get<SonarrHistoryResponse>(
          "/history",
          params
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
      } catch (error) {
        return {
          records: [],
          message: `Error getting history: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
