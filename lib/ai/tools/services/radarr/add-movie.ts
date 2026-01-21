import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type {
  RadarrMovie,
  RadarrQualityProfile,
  RadarrRootFolder,
} from "./types";

type AddMovieProps = {
  session: Session;
};

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

export const addMovie = ({ session }: AddMovieProps) =>
  tool({
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
    needsApproval: true,
    execute: async ({
      tmdbId,
      qualityProfileId,
      minimumAvailability,
      searchForMovie,
    }) => {
      try {
        // First, lookup the movie to get full details
        const lookupResults = await radarrRequest<RadarrMovie[]>(
          session.user.id,
          `/movie/lookup/tmdb?tmdbId=${tmdbId}`
        );

        if (lookupResults.length === 0) {
          return { error: `No movie found with TMDB ID ${tmdbId}.` };
        }

        const movieData = lookupResults[0];

        // Check if movie already exists
        const existingMovies = await radarrRequest<RadarrMovie[]>(
          session.user.id,
          `/movie?tmdbId=${tmdbId}`
        );

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

        // Get quality profiles if not specified
        let profileId = qualityProfileId;
        if (!profileId) {
          const profiles = await radarrRequest<RadarrQualityProfile[]>(
            session.user.id,
            "/qualityprofile"
          );
          if (profiles.length === 0) {
            return { error: "No quality profiles configured in Radarr." };
          }
          profileId = profiles[0].id;
        }

        // Get root folders
        const rootFolders = await radarrRequest<RadarrRootFolder[]>(
          session.user.id,
          "/rootfolder"
        );

        if (rootFolders.length === 0) {
          return { error: "No root folders configured in Radarr." };
        }

        const rootFolderPath = rootFolders[0].path;

        // Add the movie
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

        const addedMovie = await radarrRequest<RadarrMovie>(
          session.user.id,
          "/movie",
          {
            method: "POST",
            body: JSON.stringify(addPayload),
          }
        );

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
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to add movie. Please try again." };
      }
    },
  });
