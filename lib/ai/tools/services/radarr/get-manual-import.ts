import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";
import type { RadarrManualImportItem } from "./types";

type GetManualImportProps = {
  session: Session;
};

export const getManualImport = ({ session }: GetManualImportProps) =>
  tool({
    description:
      "List files available for manual import from a folder or download client. Use this to see what files can be imported and what movies they match. Provide either a folder path to scan or a downloadId from the queue.",
    inputSchema: z.object({
      folder: z
        .string()
        .optional()
        .describe("Path to a folder to scan for importable files"),
      downloadId: z
        .string()
        .optional()
        .describe(
          "Download client ID to get files for (from queue item's downloadId)"
        ),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "get manual import" },
      async ({ folder, downloadId }) => {
        const params = new URLSearchParams();
        if (folder) {
          params.append("folder", folder);
        }
        if (downloadId) {
          params.append("downloadId", downloadId);
        }

        const items = await radarrRequest<RadarrManualImportItem[]>(
          session.user.id,
          `/manualimport?${params.toString()}`
        );

        if (items.length === 0) {
          return {
            items: [],
            message: "No files found for manual import.",
          };
        }

        const formattedItems = items.map((item) => ({
          id: item.id,
          path: item.path,
          name: item.name,
          size: formatBytes(item.size),
          movie: item.movie
            ? {
                id: item.movie.id,
                title: item.movie.title,
                year: item.movie.year,
              }
            : null,
          quality: item.quality.quality.name,
          languages: item.languages.map((l) => l.name).join(", "),
          releaseGroup: item.releaseGroup,
          rejections: item.rejections.map((r) => r.reason),
          downloadId: item.downloadId,
        }));

        return {
          items: formattedItems,
          totalFiles: items.length,
          message: `Found ${items.length} file(s) available for manual import.`,
        };
      }
    ),
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
