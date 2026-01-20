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
      "Get TV series from the Sonarr library with filtering. Use genre filter for 'comedy shows', 'drama series', etc. Use status filter to find continuing vs ended shows.",
    inputSchema: z.object({
      genre: z
        .string()
        .optional()
        .describe(
          "Filter by genre (e.g., 'Comedy', 'Drama', 'Crime', 'Sci-Fi'). Case-insensitive partial match."
        ),
      status: z
        .enum(["continuing", "ended", "upcoming"])
        .optional()
        .describe("Filter by series status"),
      monitored: z.boolean().optional().describe("Filter by monitored status"),
      hasEpisodes: z
        .boolean()
        .optional()
        .describe(
          "Filter to only series with downloaded episodes (true) or missing all episodes (false)"
        ),
      network: z
        .string()
        .optional()
        .describe("Filter by network (e.g., 'HBO', 'Netflix', 'AMC')"),
      yearFrom: z
        .number()
        .optional()
        .describe("Filter series from this year onwards"),
      yearTo: z.number().optional().describe("Filter series up to this year"),
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
    execute: async ({
      genre,
      status,
      monitored,
      hasEpisodes,
      network,
      yearFrom,
      yearTo,
      sortBy,
      limit,
    }) => {
      try {
        const series = await sonarrRequest<SonarrSeries[]>(
          session.user.id,
          "/series"
        );

        // Apply filters
        let filteredSeries = series;

        if (genre) {
          const genreLower = genre.toLowerCase();
          filteredSeries = filteredSeries.filter((s) =>
            s.genres?.some((g) => g.toLowerCase().includes(genreLower))
          );
        }

        if (status) {
          filteredSeries = filteredSeries.filter((s) => s.status === status);
        }

        if (monitored !== undefined) {
          filteredSeries = filteredSeries.filter(
            (s) => s.monitored === monitored
          );
        }

        if (hasEpisodes !== undefined) {
          filteredSeries = filteredSeries.filter((s) =>
            hasEpisodes
              ? (s.statistics?.episodeFileCount ?? 0) > 0
              : (s.statistics?.episodeFileCount ?? 0) === 0
          );
        }

        if (network) {
          const networkLower = network.toLowerCase();
          filteredSeries = filteredSeries.filter((s) =>
            s.network?.toLowerCase().includes(networkLower)
          );
        }

        if (yearFrom !== undefined) {
          filteredSeries = filteredSeries.filter((s) => s.year >= yearFrom);
        }

        if (yearTo !== undefined) {
          filteredSeries = filteredSeries.filter((s) => s.year <= yearTo);
        }

        // Sort series
        const sortedSeries = [...filteredSeries].sort((a, b) => {
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

        // Build filter description for message
        const filters: string[] = [];
        if (genre) {
          filters.push(`genre: ${genre}`);
        }
        if (status) {
          filters.push(`status: ${status}`);
        }
        if (hasEpisodes === true) {
          filters.push("with episodes");
        }
        if (hasEpisodes === false) {
          filters.push("missing episodes");
        }
        if (monitored !== undefined) {
          filters.push(monitored ? "monitored" : "unmonitored");
        }
        if (network) {
          filters.push(`network: ${network}`);
        }
        if (yearFrom || yearTo) {
          filters.push(`years: ${yearFrom ?? "any"}-${yearTo ?? "any"}`);
        }
        const filterDesc = filters.length > 0 ? ` (${filters.join(", ")})` : "";

        return {
          results: limitedSeries.map((show) => ({
            id: show.id,
            tvdbId: show.tvdbId,
            imdbId: show.imdbId,
            title: show.title,
            year: show.year,
            overview: show.overview,
            mediaType: "tv" as const,
            posterUrl:
              show.remotePoster ??
              show.images?.find((img) => img.coverType === "poster")?.remoteUrl,
            rating: show.ratings?.value,
            genres: show.genres,
            runtime: show.runtime,
            network: show.network,
            status: show.status,
            monitored: show.monitored,
            seasonCount: show.statistics?.seasonCount ?? show.seasons?.length,
            episodeCount: show.statistics?.episodeCount,
            episodeFileCount: show.statistics?.episodeFileCount,
            qualityProfileId: show.qualityProfileId,
          })),
          totalInLibrary: series.length,
          totalMatching: filteredSeries.length,
          showing: limitedSeries.length,
          message:
            filteredSeries.length > 0
              ? `Found ${filteredSeries.length} series${filterDesc}. Showing ${limitedSeries.length}.`
              : `No series found${filterDesc}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get library. Please try again." };
      }
    },
  });
