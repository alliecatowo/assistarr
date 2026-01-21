import { tool } from "ai";
import { z } from "zod";
import type { DisplayableMedia, ToolFactoryProps } from "../core/types";
import { deriveMediaStatus } from "../core/utils";
import { RadarrClient } from "./client";
import type { RadarrMovie } from "./types";

export const searchMovies = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Search for movies in Radarr by name. Returns matching movies with full display metadata including poster URLs that can be used directly in the UI.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The movie name to search for (e.g., 'Inception', 'The Matrix')"
        ),
    }),
    execute: async ({ query }) => {
      try {
        const results = await client.get<RadarrMovie[]>("/movie/lookup", {
          term: query,
        });

        if (results.length === 0) {
          return {
            results: [],
            message: `No movies found matching "${query}".`,
          };
        }

        // Map to DisplayableMedia format - services are source of truth for display data
        const movies: DisplayableMedia[] = results.slice(0, 10).map((m) => ({
          // Required display fields
          title: m.title,
          posterUrl:
            m.remotePoster ??
            m.images.find((img) => img.coverType === "poster")?.remoteUrl ??
            null,
          mediaType: "movie" as const,

          // Rich metadata
          year: m.year,
          overview:
            m.overview?.slice(0, 200) +
            (m.overview && m.overview.length > 200 ? "..." : ""),
          rating: m.ratings?.tmdb?.value ?? m.ratings?.imdb?.value,
          genres: m.genres,
          runtime: m.runtime,

          // Status
          status: deriveMediaStatus(m.hasFile, m.monitored),
          hasFile: m.hasFile,
          monitored: m.monitored,

          // Service IDs for actions
          serviceId: m.id ?? 0, // id might be 0 for lookup results
          externalIds: {
            tmdb: m.tmdbId,
            imdb: m.imdbId,
          },
        }));

        return {
          results: movies,
          message: `Found ${results.length} movies matching "${query}". Showing top ${movies.length} results.`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error searching movies: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
