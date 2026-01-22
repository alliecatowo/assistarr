import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrQueueResponse } from "./types";

export const getQueue = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get the current download queue from Radarr. Shows movies that are currently downloading or pending download with progress information.",
    inputSchema: z.object({
      pageSize: z
        .number()
        .optional()
        .default(20)
        .describe("Number of items to return (default: 20, max: 100)"),
    }),
    execute: async ({ pageSize }) => {
      try {
        const queue = await client.get<RadarrQueueResponse>("/queue", {
          page: 1,
          pageSize: Math.min(pageSize, 100),
          includeMovie: true,
        });

        if (queue.totalRecords === 0) {
          return {
            items: [],
            totalRecords: 0,
            message: "No movies currently in the download queue.",
          };
        }

        const items = queue.records.map((item) => {
          const progress =
            item.size > 0
              ? Math.round(((item.size - item.sizeleft) / item.size) * 100)
              : 0;

          return {
            id: item.id,
            movieId: item.movieId,
            movieTitle: item.movie?.title ?? "Unknown Movie",
            movieYear: item.movie?.year,
            tmdbId: item.movie?.tmdbId,
            quality: item.quality.quality.name,
            status: item.status,
            progress: `${progress}%`,
            size: formatBytes(item.size),
            sizeRemaining: formatBytes(item.sizeleft),
            timeLeft: item.timeleft ?? "Unknown",
            downloadClient: item.downloadClient,
            protocol: item.protocol,
            errorMessage: item.errorMessage,
            downloadId: item.downloadId,
            outputPath: item.outputPath,
          };
        });

        return {
          items,
          totalRecords: queue.totalRecords,
          message: `Found ${queue.totalRecords} movie(s) in the download queue.`,
        };
      } catch (error) {
        return {
          items: [],
          totalRecords: 0,
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
