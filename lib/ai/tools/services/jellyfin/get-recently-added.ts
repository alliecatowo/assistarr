import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  formatDuration,
  getImageUrl,
  getJellyfinConfig,
  JellyfinClientError,
  jellyfinRequest,
} from "./client";
import type { MediaItem } from "./types";

interface GetRecentlyAddedProps {
  session: Session;
}

export const getRecentlyAdded = ({ session }: GetRecentlyAddedProps) =>
  tool({
    description:
      "Get recently added movies and TV shows from the Jellyfin library. Shows the newest content added to the media server.",
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Maximum number of items to return"),
      mediaType: z
        .enum(["all", "movies", "shows"])
        .default("all")
        .describe("Filter by media type: movies, shows, or all"),
    }),
    execute: async ({ limit, mediaType }) => {
      const config = await getJellyfinConfig(session.user.id);

      if (!config || !config.isEnabled) {
        return {
          error:
            "Jellyfin is not configured. Please add your Jellyfin settings in the configuration page.",
        };
      }

      // Build include item types based on filter
      let includeItemTypes = "Movie,Episode";
      if (mediaType === "movies") {
        includeItemTypes = "Movie";
      } else if (mediaType === "shows") {
        includeItemTypes = "Episode";
      }

      try {
        // Get the Jellyfin user ID
        let jellyfinUserId: string;

        try {
          const userResponse = await jellyfinRequest<{ Id: string }>(
            { baseUrl: config.baseUrl, apiKey: config.apiKey },
            "/Users/Me"
          );
          jellyfinUserId = userResponse.Id;
        } catch {
          const usersResponse = await jellyfinRequest<Array<{ Id: string }>>(
            { baseUrl: config.baseUrl, apiKey: config.apiKey },
            "/Users"
          );
          if (usersResponse.length === 0) {
            return { error: "No users found in Jellyfin server" };
          }
          jellyfinUserId = usersResponse[0].Id;
        }

        const params = new URLSearchParams({
          Limit: limit.toString(),
          IncludeItemTypes: includeItemTypes,
          Fields: "Overview,Genres,CommunityRating,DateCreated",
          EnableImages: "true",
        });

        const endpoint = `/Users/${jellyfinUserId}/Items/Latest?${params.toString()}`;

        // Note: Items/Latest returns an array directly, not wrapped in Items
        const response = await jellyfinRequest<MediaItem[]>(
          { baseUrl: config.baseUrl, apiKey: config.apiKey },
          endpoint
        );

        const results = response.map((item: MediaItem) => {
          const base = {
            id: item.Id,
            title: item.Name,
            type: item.Type,
            year: item.ProductionYear,
            dateAdded: item.DateCreated
              ? new Date(item.DateCreated).toLocaleDateString()
              : null,
            overview: item.Overview?.substring(0, 150),
            rating: item.CommunityRating,
            genres: item.Genres?.slice(0, 3),
            duration: item.RunTimeTicks
              ? formatDuration(item.RunTimeTicks)
              : null,
            imageUrl: getImageUrl(
              config.baseUrl,
              item.Id,
              item.ImageTags?.Primary
            ),
          };

          // Add episode-specific info
          if (item.Type === "Episode" && item.SeriesName) {
            return {
              ...base,
              seriesName: item.SeriesName,
              seasonNumber: item.ParentIndexNumber,
              episodeNumber: item.IndexNumber,
              displayTitle: `${item.SeriesName} - S${item.ParentIndexNumber?.toString().padStart(2, "0")}E${item.IndexNumber?.toString().padStart(2, "0")} - ${item.Name}`,
            };
          }

          return base;
        });

        return {
          results,
          totalResults: results.length,
        };
      } catch (error) {
        if (error instanceof JellyfinClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get recently added content from Jellyfin" };
      }
    },
  });
