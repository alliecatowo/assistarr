import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrSeries } from "./types";

export const getLibrary = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
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
    execute: async (params) => {
      try {
        const series = await client.get<SonarrSeries[]>("/api/v3/series");

        const filteredSeries = filterSeries(series, params);
        const sortedSeries = sortSeries(filteredSeries, params.sortBy);
        const limitedSeries = sortedSeries.slice(0, params.limit);

        const filterDesc = generateFilterDescription(params);

        return {
          results: limitedSeries.map(formatSeries),
          totalInLibrary: series.length,
          totalMatching: filteredSeries.length,
          showing: limitedSeries.length,
          message:
            filteredSeries.length > 0
              ? `Found ${filteredSeries.length} series${filterDesc}. Showing ${limitedSeries.length}.`
              : `No series found${filterDesc}.`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error getting library: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function filterSeries(
  series: SonarrSeries[],
  params: {
    genre?: string;
    status?: string;
    monitored?: boolean;
    hasEpisodes?: boolean;
    network?: string;
    yearFrom?: number;
    yearTo?: number;
  }
) {
  let result = series;

  if (params.genre) {
    const genreLower = params.genre.toLowerCase();
    result = result.filter((s) =>
      s.genres?.some((g) => g.toLowerCase().includes(genreLower))
    );
  }

  if (params.status) {
    result = result.filter((s) => s.status === params.status);
  }

  if (params.monitored !== undefined) {
    result = result.filter((s) => s.monitored === params.monitored);
  }

  if (params.hasEpisodes !== undefined) {
    result = result.filter((s) =>
      params.hasEpisodes
        ? (s.statistics?.episodeFileCount ?? 0) > 0
        : (s.statistics?.episodeFileCount ?? 0) === 0
    );
  }

  if (params.network) {
    const networkLower = params.network.toLowerCase();
    result = result.filter((s) =>
      s.network?.toLowerCase().includes(networkLower)
    );
  }

  if (params.yearFrom !== undefined) {
    result = result.filter((s) => s.year >= (params.yearFrom as number));
  }

  if (params.yearTo !== undefined) {
    result = result.filter((s) => s.year <= (params.yearTo as number));
  }

  return result;
}

function sortSeries(series: SonarrSeries[], sortBy = "title") {
  return [...series].sort((a, b) => {
    switch (sortBy) {
      case "dateAdded":
        return (
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
        );
      case "year":
        return (b.year || 0) - (a.year || 0);
      case "rating":
        return (b.ratings?.value || 0) - (a.ratings?.value || 0);
      default:
        return a.title.localeCompare(b.title);
    }
  });
}

function formatSeries(show: SonarrSeries) {
  return {
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
  };
}

function generateFilterDescription(params: {
  genre?: string;
  status?: string;
  monitored?: boolean;
  hasEpisodes?: boolean;
  network?: string;
  yearFrom?: number;
  yearTo?: number;
}) {
  const filters: string[] = [];
  if (params.genre) {
    filters.push(`genre: ${params.genre}`);
  }
  if (params.status) {
    filters.push(`status: ${params.status}`);
  }
  if (params.hasEpisodes === true) {
    filters.push("with episodes");
  }
  if (params.hasEpisodes === false) {
    filters.push("missing episodes");
  }
  if (params.monitored !== undefined) {
    filters.push(params.monitored ? "monitored" : "unmonitored");
  }
  if (params.network) {
    filters.push(`network: ${params.network}`);
  }
  if (params.yearFrom || params.yearTo) {
    filters.push(
      `years: ${params.yearFrom ?? "any"}-${params.yearTo ?? "any"}`
    );
  }
  return filters.length > 0 ? ` (${filters.join(", ")})` : "";
}
