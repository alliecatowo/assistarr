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
      const lookupResults = await client.get<SonarrSeries[]>("/series/lookup", {
        term: `tvdb:${tvdbId}`,
      });

      if (lookupResults.length === 0) {
        throw new Error(`No series found with TVDB ID ${tvdbId}.`);
      }

      const seriesData = lookupResults[0];

      const existingSeries = await client.get<SonarrSeries[]>("/series", {
        tvdbId,
      });

      if (existingSeries.length > 0) {
        throw new Error(
          `"${seriesData.title}" is already in your Sonarr library.`
        );
      }

      const profileId = await getQualityProfileId(client, qualityProfileId);
      if (!profileId) {
        throw new Error("No quality profiles configured in Sonarr.");
      }

      const rootFolderPath = await getRootFolderPath(client);
      if (!rootFolderPath) {
        throw new Error("No root folders configured in Sonarr.");
      }

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
        "/series",
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
    },
  });
};

async function getQualityProfileId(client: SonarrClient, requestedId?: number) {
  if (requestedId) {
    return requestedId;
  }

  const profiles = await client.get<SonarrQualityProfile[]>("/qualityprofile");
  if (profiles.length === 0) {
    return null;
  }

  return profiles[0].id;
}

async function getRootFolderPath(client: SonarrClient) {
  const rootFolders = await client.get<SonarrRootFolder[]>("/rootfolder");
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
