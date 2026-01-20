import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { sonarrRequest, SonarrClientError } from "./client";
import type { SonarrCalendarEpisode } from "./types";

type GetCalendarProps = {
  session: Session;
};

export const getCalendar = ({ session }: GetCalendarProps) =>
  tool({
    description:
      "Get upcoming TV episodes from Sonarr. Shows episodes that will air within the specified number of days, including air dates and series information.",
    inputSchema: z.object({
      days: z
        .number()
        .optional()
        .default(7)
        .describe("Number of days to look ahead (default: 7)"),
      includePast: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include episodes that aired in the past few days (default: false)"),
    }),
    execute: async ({ days, includePast }) => {
      try {
        const now = new Date();
        const start = includePast
          ? new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          : now;
        const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const episodes = await sonarrRequest<SonarrCalendarEpisode[]>(
          session.user.id,
          `/calendar?start=${start.toISOString()}&end=${end.toISOString()}&includeSeries=true`
        );

        if (episodes.length === 0) {
          return {
            episodes: [],
            message: `No episodes scheduled in the next ${days} days.`,
          };
        }

        const calendarItems = episodes.map((episode) => {
          const airDate = new Date(episode.airDateUtc);
          const isAired = airDate < now;
          const daysUntil = Math.ceil(
            (airDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );

          return {
            seriesTitle: episode.series?.title ?? "Unknown Series",
            episodeTitle: episode.title,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            airDate: episode.airDate,
            airDateUtc: episode.airDateUtc,
            network: episode.series?.network,
            hasFile: episode.hasFile,
            monitored: episode.monitored,
            overview: episode.overview?.slice(0, 150) + (episode.overview && episode.overview.length > 150 ? "..." : ""),
            status: isAired
              ? episode.hasFile
                ? "downloaded"
                : "missing"
              : daysUntil === 0
                ? "airing today"
                : daysUntil === 1
                  ? "airing tomorrow"
                  : `airing in ${daysUntil} days`,
          };
        });

        // Sort by air date
        calendarItems.sort(
          (a, b) =>
            new Date(a.airDateUtc).getTime() - new Date(b.airDateUtc).getTime()
        );

        return {
          episodes: calendarItems,
          message: `Found ${episodes.length} episode(s) scheduled${includePast ? " (including recent)" : ""}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get calendar. Please try again." };
      }
    },
  });
