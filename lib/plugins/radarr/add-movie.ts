import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type {
  RadarrMovie,
  RadarrQualityProfile,
  RadarrRootFolder,
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
    status: z
      .enum([
        "available",
        "wanted",
        "downloading",
        "requested",
        "missing",
        "error",
      ])
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

export const addMovie = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Add a movie to the Radarr library for automatic downloading. Requires the tmdbId from a search result. Will automatically start searching for the movie.",
    inputSchema: z.object({
      tmdbId: z
        .number()
        .describe("The TMDB ID of the movie to add (from search results)"),
      qualityProfileId: z
        .number()
        .optional()
        .describe(
          "Optional quality profile ID. If not provided, uses the first available profile."
        ),
      minimumAvailability: z
        .enum(["announced", "inCinemas", "released"])
        .optional()
        .default("released")
        .describe(
          "When to consider the movie available: 'announced', 'inCinemas', or 'released' (default)"
        ),
      searchForMovie: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Whether to search for the movie immediately (default: true)"
        ),
      // Metadata from prior search - used by ApprovalCard for rich display without extra fetch
      metadata: displayableMediaSchema.describe(
        "Display metadata from search results. Pass this so the approval UI can show rich info without fetching."
      ),
    }),

    execute: async ({
      tmdbId,
      qualityProfileId,
      minimumAvailability,
      searchForMovie,
    }) => {
      try {
        const lookupResults = await client.get<RadarrMovie[]>(
          "/movie/lookup/tmdb",
          { tmdbId }
        );

        if (lookupResults.length === 0) {
          return { error: `No movie found with TMDB ID ${tmdbId}.` };
        }
        const movieData = lookupResults[0];

        // Check if exists
        const existsRef = await checkExisting(client, tmdbId, movieData);
        if (existsRef) {
          return existsRef;
        }

        const profileId = await getProfileId(client, qualityProfileId);
        if (profileId === null) {
          return { error: "No quality profiles configured in Radarr." };
        }

        const rootFolderPath = await getRootFolderPath(client);
        if (rootFolderPath === null) {
          return { error: "No root folders configured in Radarr." };
        }

        const addPayload = {
          tmdbId: movieData.tmdbId,
          title: movieData.title,
          qualityProfileId: profileId,
          titleSlug: movieData.titleSlug,
          images: movieData.images,
          rootFolderPath,
          monitored: true,
          minimumAvailability,
          addOptions: {
            monitor: "movieOnly",
            searchForMovie,
          },
        };

        const addedMovie = await client.post<RadarrMovie>("/movie", addPayload);

        return {
          success: true,
          message: `Successfully added "${addedMovie.title}" to Radarr.`,
          movie: {
            id: addedMovie.id,
            title: addedMovie.title,
            year: addedMovie.year,
            path: addedMovie.path,
            monitored: addedMovie.monitored,
            minimumAvailability: addedMovie.minimumAvailability,
            searchingForMovie: searchForMovie,
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          error: `Failed to add movie: ${errorMessage}`,
        };
      }
    },
  });
};

async function checkExisting(
  client: RadarrClient,
  tmdbId: number,
  movieData: RadarrMovie
) {
  const existingMovies = await client.get<RadarrMovie[]>("/movie", { tmdbId });
  if (existingMovies.length > 0) {
    return {
      error: `"${movieData.title}" is already in your Radarr library.`,
      existingMovie: {
        title: existingMovies[0].title,
        id: existingMovies[0].id,
        path: existingMovies[0].path,
        hasFile: existingMovies[0].hasFile,
      },
    };
  }
  return null;
}

async function getProfileId(client: RadarrClient, qualityProfileId?: number) {
  if (qualityProfileId) {
    return qualityProfileId;
  }
  const profiles = await client.get<RadarrQualityProfile[]>("/qualityprofile");
  if (profiles.length === 0) {
    return null;
  }
  return profiles[0].id;
}

async function getRootFolderPath(client: RadarrClient) {
  const rootFolders = await client.get<RadarrRootFolder[]>("/rootfolder");
  if (rootFolders.length === 0) {
    return null;
  }
  return rootFolders[0].path;
}
