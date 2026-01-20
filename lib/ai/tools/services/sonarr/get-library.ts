import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type { SonarrSeries } from "./types";

type GetLibraryProps = {
  session: Session;
};

export const getLibrary = ({ session }: GetLibraryProps) =>
  tool({
    description:
      "Get all series currently in the Sonarr library. Returns a list of all monitored and downloaded shows with their status, quality, and file info.",
    inputSchema: z.object({
      sortBy: z
        .enum(["title", "dateAdded", "year", "rating"])
        .optional()
        .default("title")
        .describe("How to sort the results"),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Maximum number of series to return (default 50)"),
    }),
    execute: async ({ sortBy, limit }) => {
      try {
        const series = await sonarrRequest<SonarrSeries[]>(
          session.user.id,
          "/series"
        );

        // Sort series
        const sortedSeries = [...series].sort((a, b) => {
          switch (sortBy) {
            case "dateAdded":
              return (
                new Date(b.added ?? 0).getTime() -
                new Date(a.added ?? 0).getTime()
              );
            case "year":
              return (b.year || 0) - (a.year || 0);
            case "rating":
              return (b.ratings?.value || 0) - (a.ratings?.value || 0);
            default:
              return a.title.localeCompare(b.title);
          }
        });

        // Limit results
        const limitedSeries = sortedSeries.slice(0, limit);

        return {
          success: true,
          totalSeries: series.length,
          showing: limitedSeries.length,
          series: limitedSeries.map((show) => ({
            id: show.id,
            title: show.title,
            year: show.year,
            monitored: show.monitored,
            status: show.status,
            qualityProfileId: show.qualityProfileId,
            episodeCount: show.statistics?.episodeCount,
            episodeFileCount: show.statistics?.episodeFileCount,
            network: show.network,
          })),
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get library. Please try again." };
      }
    },
  });
