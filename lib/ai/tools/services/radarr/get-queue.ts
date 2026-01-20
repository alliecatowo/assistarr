import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { radarrRequest, RadarrClientError } from "./client";
import type { RadarrQueueResponse } from "./types";

type GetQueueProps = {
  session: Session;
};

export const getQueue = ({ session }: GetQueueProps) =>
  tool({
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
        const queue = await radarrRequest<RadarrQueueResponse>(
          session.user.id,
          `/queue?page=1&pageSize=${Math.min(pageSize, 100)}&includeMovie=true`
        );

        if (queue.totalRecords === 0) {
          return {
            items: [],
            totalRecords: 0,
            message: "No movies currently in the download queue.",
          };
        }

        const items = queue.records.map((item) => {
          const progress = item.size > 0
            ? Math.round(((item.size - item.sizeleft) / item.size) * 100)
            : 0;

          return {
            id: item.id,
            movieTitle: item.movie?.title ?? "Unknown Movie",
            movieYear: item.movie?.year,
            quality: item.quality.quality.name,
            status: item.status,
            progress: `${progress}%`,
            size: formatBytes(item.size),
            sizeRemaining: formatBytes(item.sizeleft),
            timeLeft: item.timeleft ?? "Unknown",
            downloadClient: item.downloadClient,
            protocol: item.protocol,
            errorMessage: item.errorMessage,
          };
        });

        return {
          items,
          totalRecords: queue.totalRecords,
          message: `Found ${queue.totalRecords} movie(s) in the download queue.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get download queue. Please try again." };
      }
    },
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
