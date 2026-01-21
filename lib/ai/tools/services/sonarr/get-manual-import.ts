import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";
import type { SonarrManualImportItem } from "./types";

type GetManualImportProps = {
  session: Session;
};

export const getManualImport = ({ session }: GetManualImportProps) =>
  tool({
    description:
      "List files available for manual import in Sonarr. Use this to see what files are available in a folder or download for importing into the library. You must provide either a folder path or a downloadId.",
    inputSchema: z.object({
      folder: z
        .string()
        .optional()
        .describe("The folder path to scan for importable files"),
      downloadId: z
        .string()
        .optional()
        .describe(
          "The download client ID to get files for (from the queue item)"
        ),
      seriesId: z
        .number()
        .optional()
        .describe("Optional: Filter results for a specific series"),
      seasonNumber: z
        .number()
        .optional()
        .describe("Optional: Filter results for a specific season"),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "get manual import" },
      async ({ folder, downloadId, seriesId, seasonNumber }) => {
        if (!folder && !downloadId) {
          return {
            error:
              "You must provide either a folder path or a downloadId to scan for files.",
          };
        }

        const params = new URLSearchParams();
        if (folder) params.append("folder", folder);
        if (downloadId) params.append("downloadId", downloadId);
        if (seriesId !== undefined)
          params.append("seriesId", seriesId.toString());
        if (seasonNumber !== undefined)
          params.append("seasonNumber", seasonNumber.toString());

        const items = await sonarrRequest<SonarrManualImportItem[]>(
          session.user.id,
          `/manualimport?${params.toString()}`
        );

        if (items.length === 0) {
          return {
            items: [],
            message: "No files found for import.",
          };
        }

        const formattedItems = items.map((item) => ({
          id: item.id,
          path: item.path,
          name: item.name,
          size: formatBytes(item.size),
          seriesTitle: item.series?.title ?? "Unknown",
          seriesId: item.series?.id,
          seasonNumber: item.seasonNumber,
          episodes: item.episodes?.map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
          })),
          quality: item.quality.quality.name,
          releaseGroup: item.releaseGroup,
          rejections:
            item.rejections.length > 0
              ? item.rejections.map((r) => r.reason)
              : undefined,
        }));

        return {
          items: formattedItems,
          totalFiles: items.length,
          message: `Found ${items.length} file(s) available for import.`,
        };
      }
    ),
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
