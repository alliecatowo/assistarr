import { tool } from "ai";
import { z } from "zod";
import { type DisplayableMedia, deriveMediaStatus } from "../base";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrSeries } from "./types";

export const searchSeries = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Search for TV series in Sonarr by name. Returns matching series with full display metadata including poster URLs that can be used directly in the UI.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The TV series name to search for (e.g., 'Breaking Bad', 'The Office')"
        ),
    }),
    execute: async ({ query }) => {
      try {
        const results = await client.get<SonarrSeries[]>(
          "/api/v3/series/lookup",
          {
            term: query,
          }
        );

        if (results.length === 0) {
          return {
            results: [],
            message: `No TV series found matching "${query}".`,
          };
        }

        const series: DisplayableMedia[] = results.slice(0, 10).map((s) => ({
          title: s.title,
          posterUrl:
            s.remotePoster ??
            s.images.find((img) => img.coverType === "poster")?.remoteUrl ??
            null,
          mediaType: "tv" as const,
          year: s.year,
          overview:
            s.overview?.slice(0, 200) +
            (s.overview && s.overview.length > 200 ? "..." : ""),
          rating: s.ratings?.value,
          genres: s.genres,
          runtime: s.runtime,
          seasonCount:
            s.statistics?.seasonCount ??
            s.seasons?.filter((season) => season.seasonNumber > 0).length ??
            0,
          status: deriveMediaStatus(
            (s.statistics?.episodeFileCount ?? 0) > 0,
            s.monitored
          ),
          monitored: s.monitored,
          externalIds: {
            tvdb: s.tvdbId,
            imdb: s.imdbId,
          },
        }));

        return {
          results: series,
          message: `Found ${results.length} TV series matching "${query}". Showing top ${series.length} results.`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error searching series: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
