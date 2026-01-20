import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type {
  SonarrQualityProfile,
  SonarrRootFolder,
  SonarrSeries,
} from "./types";

type AddSeriesProps = {
  session: Session;
};

export const addSeries = ({ session }: AddSeriesProps) =>
  tool({
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
    }),
    needsApproval: true,
    execute: async ({
      tvdbId,
      qualityProfileId,
      monitor,
      searchForMissingEpisodes,
    }) => {
      try {
        // First, lookup the series to get full details
        const lookupResults = await sonarrRequest<SonarrSeries[]>(
          session.user.id,
          `/series/lookup?term=tvdb:${tvdbId}`
        );

        if (lookupResults.length === 0) {
          return { error: `No series found with TVDB ID ${tvdbId}.` };
        }

        const seriesData = lookupResults[0];

        // Check if series already exists
        const existingSeries = await sonarrRequest<SonarrSeries[]>(
          session.user.id,
          `/series?tvdbId=${tvdbId}`
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

        // Get quality profiles if not specified
        let profileId = qualityProfileId;
        if (!profileId) {
          const profiles = await sonarrRequest<SonarrQualityProfile[]>(
            session.user.id,
            "/qualityprofile"
          );
          if (profiles.length === 0) {
            return { error: "No quality profiles configured in Sonarr." };
          }
          profileId = profiles[0].id;
        }

        // Get root folders
        const rootFolders = await sonarrRequest<SonarrRootFolder[]>(
          session.user.id,
          "/rootfolder"
        );

        if (rootFolders.length === 0) {
          return { error: "No root folders configured in Sonarr." };
        }

        const rootFolderPath = rootFolders[0].path;

        // Add the series
        const addPayload = {
          tvdbId: seriesData.tvdbId,
          title: seriesData.title,
          qualityProfileId: profileId,
          titleSlug: seriesData.titleSlug,
          images: seriesData.images,
          seasons: seriesData.seasons.map((season) => ({
            seasonNumber: season.seasonNumber,
            monitored:
              monitor === "all" ||
              (monitor === "firstSeason" && season.seasonNumber === 1) ||
              (monitor === "lastSeason" &&
                season.seasonNumber ===
                  seriesData.seasons.filter((s) => s.seasonNumber > 0).length),
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

        const addedSeries = await sonarrRequest<SonarrSeries>(
          session.user.id,
          "/series",
          {
            method: "POST",
            body: JSON.stringify(addPayload),
          }
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
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to add TV series. Please try again." };
      }
    },
  });
