import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type {
  SonarrQualityProfile,
  SonarrRootFolder,
  SonarrSeries,
} from "./types";

// Schema for DisplayableMedia passed from search results
const displayableMediaSchema = z
  .object({
    title: z.string(),
    posterUrl: z.string().nullable(),
    mediaType: z.enum(["movie", "tv", "episode"]),
    year: z.number().optional(),
    overview: z.string().optional(),
    rating: z.number().optional(),
    genres: z.array(z.string()).optional(),
    runtime: z.number().optional(),
    seasonCount: z.number().optional(),
    status: z
      .enum(["available", "wanted", "downloading", "requested", "missing"])
      .optional(),
    externalIds: z
      .object({
        tmdb: z.number().optional(),
        tvdb: z.number().optional(),
        imdb: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const addSeries = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Add a TV series to the Sonarr library for automatic downloading. Requires the tvdbId from a search result. Will automatically start searching for episodes.",
    inputSchema: z.object({
      tvdbId: z
        .number()
        .describe("The TVDB ID of the series to add (from search results)"),
      qualityProfileId: z
        .number()
        .optional()
        .describe(
          "Optional quality profile ID. If not provided, uses the first available profile."
        ),
      monitor: z
        .enum([
          "all",
          "future",
          "missing",
          "existing",
          "firstSeason",
          "lastSeason",
          "pilot",
          "none",
        ])
        .optional()
        .default("all")
        .describe(
          "Which episodes to monitor: 'all' (default), 'future', 'missing', 'existing', 'firstSeason', 'lastSeason', 'pilot', or 'none'"
        ),
      searchForMissingEpisodes: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Whether to search for missing episodes immediately (default: true)"
        ),
      // Metadata from prior search - used by ApprovalCard for rich display without extra fetch
      metadata: displayableMediaSchema.describe(
        "Display metadata from search results. Pass this so the approval UI can show rich info without fetching."
      ),
    }),
    execute: async ({
      tvdbId,
      qualityProfileId,
      monitor,
      searchForMissingEpisodes,
    }) => {
      try {
        // First, lookup the series to get full details
        const lookupResults = await client.get<SonarrSeries[]>(
          "/api/v3/series/lookup",
          {
            term: `tvdb:${tvdbId}`,
          }
        );

        if (lookupResults.length === 0) {
          return { error: `No series found with TVDB ID ${tvdbId}.` };
        }

        const seriesData = lookupResults[0];

        // Check if series already exists
        const existingSeries = await client.get<SonarrSeries[]>(
          "/api/v3/series",
          {
            tvdbId,
          }
        );

        if (existingSeries.length > 0) {
          return {
            error: `"${seriesData.title}" is already in your Sonarr library.`,
            existingSeries: {
              title: existingSeries[0].title,
              id: existingSeries[0].id,
              path: existingSeries[0].path,
            },
          };
        }

        // Get quality profile
        const profileId = await getQualityProfileId(client, qualityProfileId);
        if (!profileId) {
          return { error: "No quality profiles configured in Sonarr." };
        }

        // Get root folder
        const rootFolderPath = await getRootFolderPath(client);
        if (!rootFolderPath) {
          return { error: "No root folders configured in Sonarr." };
        }

        // Add the series
        const addPayload = {
          tvdbId: seriesData.tvdbId,
          title: seriesData.title,
          qualityProfileId: profileId,
          titleSlug: seriesData.titleSlug,
          images: seriesData.images,
          seasons: seriesData.seasons.map((season) => ({
            seasonNumber: season.seasonNumber,
            monitored: shouldMonitorSeason(
              season.seasonNumber,
              monitor,
              seriesData.seasons.length
            ),
          })),
          rootFolderPath,
          monitored: true,
          seasonFolder: true,
          seriesType: seriesData.seriesType,
          addOptions: {
            monitor,
            searchForMissingEpisodes,
            searchForCutoffUnmetEpisodes: false,
          },
        };

        const addedSeries = await client.post<SonarrSeries>(
          "/api/v3/series",
          addPayload
        );

        return {
          success: true,
          message: `Successfully added "${addedSeries.title}" to Sonarr.`,
          series: {
            id: addedSeries.id,
            title: addedSeries.title,
            year: addedSeries.year,
            path: addedSeries.path,
            monitored: addedSeries.monitored,
            seasonCount: addedSeries.seasons.filter((s) => s.seasonNumber > 0)
              .length,
            searchingForEpisodes: searchForMissingEpisodes,
          },
        };
      } catch (error) {
        return {
          error: `Failed to add series: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

async function getQualityProfileId(client: SonarrClient, requestedId?: number) {
  if (requestedId) {
    return requestedId;
  }

  const profiles = await client.get<SonarrQualityProfile[]>(
    "/api/v3/qualityprofile"
  );
  if (profiles.length === 0) {
    return null;
  }

  return profiles[0].id;
}

async function getRootFolderPath(client: SonarrClient) {
  const rootFolders =
    await client.get<SonarrRootFolder[]>("/api/v3/rootfolder");
  if (rootFolders.length === 0) {
    return null;
  }

  return rootFolders[0].path;
}

function shouldMonitorSeason(
  seasonNumber: number,
  monitorMode: string | undefined,
  totalSeasons: number
): boolean {
  if (monitorMode === "all") {
    return true;
  }
  if (monitorMode === "firstSeason" && seasonNumber === 1) {
    return true;
  }
  if (monitorMode === "lastSeason" && seasonNumber === totalSeasons) {
    return true;
  }
  if (monitorMode === "none") {
    return false;
  }

  // Default fallback
  return false;
}
