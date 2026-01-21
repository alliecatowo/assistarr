import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrManualImportItem } from "./types";

export const getManualImport = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
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
    execute: async (params) => {
      try {
        if (!params.folder && !params.downloadId) {
          return {
            error:
              "You must provide either a folder path or a downloadId to scan for files.",
          };
        }

        const queryParams = buildQueryParams(params);

        const items = await client.get<SonarrManualImportItem[]>(
          "/manualimport",
          queryParams
        );

        if (items.length === 0) {
          return {
            items: [],
            message: "No files found for import.",
          };
        }

        const formattedItems = items.map(formatManualImportItem);

        return {
          items: formattedItems,
          totalFiles: items.length,
          message: `Found ${items.length} file(s) available for import.`,
        };
      } catch (error) {
        return {
          items: [],
          message: `Error getting manual import items: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function buildQueryParams(params: {
  folder?: string;
  downloadId?: string;
  seriesId?: number;
  seasonNumber?: number;
}) {
  const queryParams: Record<string, string | number> = {};
  if (params.folder) {
    queryParams.folder = params.folder;
  }
  if (params.downloadId) {
    queryParams.downloadId = params.downloadId;
  }
  if (params.seriesId !== undefined) {
    queryParams.seriesId = params.seriesId;
  }
  if (params.seasonNumber !== undefined) {
    queryParams.seasonNumber = params.seasonNumber;
  }
  return queryParams;
}

function formatManualImportItem(item: SonarrManualImportItem) {
  return {
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
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
