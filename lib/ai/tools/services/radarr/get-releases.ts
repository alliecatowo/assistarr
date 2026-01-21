import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

interface RadarrRelease {
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
  sceneSource: boolean;
  movieTitles: string[];
  languages: Array<{ id: number; name: string }>;
  approved: boolean;
  temporarilyRejected: boolean;
  rejected: boolean;
  rejections: Array<{ type: string; reason: string }>;
  seeders?: number;
  leechers?: number;
  protocol: "usenet" | "torrent";
  indexerFlags: string[];
  infoUrl?: string;
  downloadUrl?: string;
}

type GetReleasesProps = {
  session: Session;
};

export const getReleases = ({ session }: GetReleasesProps) =>
  tool({
    description:
      "Get available releases (torrents/NZBs) for a movie from indexers. Use this when a download is stalled and you want to find an alternative release to grab. Returns a list of available releases sorted by quality.",
    inputSchema: z.object({
      movieId: z
        .number()
        .describe(
          "The Radarr movie ID to get releases for (get this from getLibrary or getQueue)"
        ),
    }),
    execute: async ({ movieId }) => {
      try {
        const releases = await radarrRequest<RadarrRelease[]>(
          session.user.id,
          `/release?movieId=${movieId}`
        );

        if (releases.length === 0) {
          return {
            releases: [],
            message: "No releases found for this movie.",
          };
        }

        // Sort by quality score and seeders, filter to approved releases
        const sortedReleases = releases
          .filter((r) => r.approved || r.temporarilyRejected)
          .sort((a, b) => {
            // Prefer approved over temporarily rejected
            if (a.approved && !b.approved) {
              return -1;
            }
            if (!a.approved && b.approved) {
              return 1;
            }
            // Then sort by quality weight
            if (b.qualityWeight !== a.qualityWeight) {
              return b.qualityWeight - a.qualityWeight;
            }
            // Then by seeders for torrents
            return (b.seeders ?? 0) - (a.seeders ?? 0);
          })
          .slice(0, 15); // Limit to top 15 releases

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
          customFormats: release.customFormats.map((cf) => cf.name),
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
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `Movie with ID ${movieId} not found in Radarr.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to get releases: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
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
