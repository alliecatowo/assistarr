import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { sonarrRequest, SonarrClientError } from "./client";
import type { SonarrSeries } from "./types";

type SearchSeriesProps = {
  session: Session;
};

export const searchSeries = ({ session }: SearchSeriesProps) =>
  tool({
    description:
      "Search for TV series in Sonarr by name. Returns matching series with title, year, overview, and tvdbId that can be used to add the series to the library.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The TV series name to search for (e.g., 'Breaking Bad', 'The Office')"),
    }),
    execute: async ({ query }) => {
      try {
        const results = await sonarrRequest<SonarrSeries[]>(
          session.user.id,
          `/series/lookup?term=${encodeURIComponent(query)}`
        );

        if (results.length === 0) {
          return {
            results: [],
            message: `No TV series found matching "${query}".`,
          };
        }

        const series = results.slice(0, 10).map((s) => ({
          title: s.title,
          year: s.year,
          overview: s.overview?.slice(0, 200) + (s.overview && s.overview.length > 200 ? "..." : ""),
          tvdbId: s.tvdbId,
          status: s.status,
          network: s.network,
          genres: s.genres,
          runtime: s.runtime,
          seasonCount: s.statistics?.seasonCount ?? s.seasons?.filter(season => season.seasonNumber > 0).length ?? 0,
          posterUrl: s.remotePoster ?? s.images.find((img) => img.coverType === "poster")?.remoteUrl,
        }));

        return {
          results: series,
          message: `Found ${results.length} TV series matching "${query}". Showing top ${series.length} results.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to search for TV series. Please try again." };
      }
    },
  });
