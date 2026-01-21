import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

interface SonarrRelease {
  guid: string;
  quality: {
    quality: {
      id: number;
      name: string;
      source: string;
      resolution: number;
    };
  };
  customFormats: Array<{ id: number; name: string }>;
  customFormatScore: number;
  qualityWeight: number;
  age: number;
  ageHours: number;
  ageMinutes: number;
  size: number;
  indexer: string;
  indexerId: number;
  releaseGroup?: string;
  releaseHash?: string;
  title: string;
  fullSeason: boolean;
  sceneSource: boolean;
  seasonNumber: number;
  episodeNumbers: number[];
  languages: Array<{ id: number; name: string }>;
  approved: boolean;
  temporarilyRejected: boolean;
  rejected: boolean;
  rejections: Array<{ type: string; reason: string }>;
  seeders?: number;
  leechers?: number;
  protocol: "usenet" | "torrent";
  indexerFlags: string[];
  episodeRequested: boolean;
  downloadAllowed: boolean;
}

export const getReleases = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Get available releases (torrents/NZBs) for a series episode from indexers. Use this when a download is stalled and you want to find an alternative release. You can search by episode ID for specific episodes.",
    inputSchema: z.object({
      episodeId: z
        .number()
        .optional()
        .describe("The Sonarr episode ID to get releases for (from getQueue)"),
      seriesId: z
        .number()
        .optional()
        .describe(
          "The Sonarr series ID (from getLibrary) - use with seasonNumber"
        ),
      seasonNumber: z
        .number()
        .optional()
        .describe("The season number to get releases for (use with seriesId)"),
    }),
    execute: async ({ episodeId, seriesId, seasonNumber }) => {
      try {
        const params: Record<string, string | number> = {};

        if (episodeId) {
          params.episodeId = episodeId;
        } else if (seriesId && seasonNumber !== undefined) {
          params.seriesId = seriesId;
          params.seasonNumber = seasonNumber;
        } else {
          return {
            error:
              "Please provide either episodeId or both seriesId and seasonNumber",
          };
        }

        const releases = await client.get<SonarrRelease[]>("/release", params);

        if (releases.length === 0) {
          return {
            releases: [],
            message: "No releases found.",
          };
        }

        const sortedReleases = releases
          .filter((r) => r.approved || r.temporarilyRejected)
          .sort((a, b) => {
            if (a.approved && !b.approved) {
              return -1;
            }
            if (!a.approved && b.approved) {
              return 1;
            }
            if (b.qualityWeight !== a.qualityWeight) {
              return b.qualityWeight - a.qualityWeight;
            }
            return (b.seeders ?? 0) - (a.seeders ?? 0);
          })
          .slice(0, 15);

        const formattedReleases = sortedReleases.map((release, index) => ({
          rank: index + 1,
          guid: release.guid,
          indexerId: release.indexerId,
          title: release.title,
          quality: release.quality.quality.name,
          size: formatBytes(release.size),
          age: formatAge(release.ageHours),
          indexer: release.indexer,
          protocol: release.protocol,
          seeders: release.seeders,
          leechers: release.leechers,
          releaseGroup: release.releaseGroup,
          fullSeason: release.fullSeason,
          seasonNumber: release.seasonNumber,
          episodes: release.episodeNumbers,
          approved: release.approved,
          rejectionReasons: release.temporarilyRejected
            ? release.rejections.map((r) => r.reason)
            : [],
        }));

        return {
          releases: formattedReleases,
          totalFound: releases.length,
          message: `Found ${releases.length} releases. Showing top ${formattedReleases.length} sorted by quality.`,
        };
      } catch (error) {
        return {
          releases: [],
          message: `Error getting releases: ${error instanceof Error ? error.message : "Unknown error"}`,
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

function formatAge(hours: number): string {
  if (hours < 1) {
    return "< 1 hour";
  }
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  }
  const days = Math.round(hours / 24);
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}
