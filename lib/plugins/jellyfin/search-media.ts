import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { formatDuration, getImageUrl, JellyfinClient } from "./client";
import type { ItemsResponse, MediaItem } from "./types";

export const searchMedia = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyfinClient(config);

  return tool({
    description:
      "Search for movies and TV shows in the Jellyfin media library. Use this to find specific titles by name.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("The search term to find movies or shows"),
      limit: z
        .number()
        .min(1)
        .max(25)
        .default(10)
        .describe("Maximum number of results to return"),
      mediaType: z
        .enum(["all", "movies", "shows"])
        .default("all")
        .describe("Filter by media type: movies, shows, or all"),
    }),
    execute: async ({ query, limit, mediaType }) => {
      try {
        let includeItemTypes = "Movie,Series";
        if (mediaType === "movies") {
          includeItemTypes = "Movie";
        } else if (mediaType === "shows") {
          includeItemTypes = "Series";
        }

        const params = new URLSearchParams({
          SearchTerm: query,
          IncludeItemTypes: includeItemTypes,
          Recursive: "true",
          Limit: limit.toString(),
          Fields: "Overview,Genres,CommunityRating,ProductionYear",
          EnableImages: "true",
        });

        const jellyfinUserId = await getUserId(client);

        const endpoint = `/Users/${jellyfinUserId}/Items?${params.toString()}`;

        const response = await client.get<ItemsResponse>(endpoint);

        const results = response.Items.map((item: MediaItem) => ({
          id: item.Id,
          title: item.Name,
          type: item.Type,
          year: item.ProductionYear,
          overview: item.Overview?.substring(0, 200),
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
          isWatched: item.UserData?.Played ?? false,
          isFavorite: item.UserData?.IsFavorite ?? false,
        }));

        return {
          results,
          totalResults: response.TotalRecordCount,
          query,
          message: `Found ${results.length} result(s) for "${query}".`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error searching media: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

async function getUserId(client: JellyfinClient): Promise<string> {
  try {
    const userResponse = await client.get<{ Id: string }>("/Users/Me");
    return userResponse.Id;
  } catch {
    const usersResponse = await client.get<Array<{ Id: string }>>("/Users");
    if (usersResponse.length === 0) {
      throw new Error("No users found in Jellyfin server");
    }
    return usersResponse[0].Id;
  }
}
