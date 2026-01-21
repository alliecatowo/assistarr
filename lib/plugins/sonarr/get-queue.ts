import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrQueueResponse } from "./types";

export const getQueue = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Get the current download queue from Sonarr. Shows TV episodes that are currently downloading or pending download with progress information.",
    inputSchema: z.object({
      pageSize: z
        .number()
        .optional()
        .default(20)
        .describe("Number of items to return (default: 20, max: 100)"),
    }),
    execute: async ({ pageSize }) => {
      try {
        const queue = await client.get<SonarrQueueResponse>("/api/v3/queue", {
          page: 1,
          pageSize: Math.min(pageSize, 100),
          includeSeries: true,
          includeEpisode: true,
        });

        if (queue.totalRecords === 0) {
          return {
            items: [],
            totalRecords: 0,
            message: "No episodes currently in the download queue.",
          };
        }

        const items = queue.records.map((item) => {
          const progress =
            item.size > 0
              ? Math.round(((item.size - item.sizeleft) / item.size) * 100)
              : 0;

          return {
            id: item.id,
            seriesTitle: item.series?.title ?? "Unknown Series",
            seriesId: item.seriesId,
            episodeTitle: item.episode?.title ?? "Unknown Episode",
            seasonNumber: item.episode?.seasonNumber ?? item.seasonNumber,
            episodeNumber: item.episode?.episodeNumber,
            quality: item.quality.quality.name,
            status: item.status,
            progress: `${progress}%`,
            size: formatBytes(item.size),
            sizeRemaining: formatBytes(item.sizeleft),
            timeLeft: item.timeleft ?? "Unknown",
            downloadClient: item.downloadClient,
            protocol: item.protocol,
            downloadId: item.downloadId,
            outputPath: item.outputPath,
          };
        });

        return {
          items,
          totalRecords: queue.totalRecords,
          message: `Found ${queue.totalRecords} item(s) in the download queue.`,
        };
      } catch (error) {
        return {
          items: [],
          message: `Error getting queue: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
