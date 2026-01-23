import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { formatDuration, getImageUrl, JellyfinClient } from "./client";
import type { MediaItem } from "./types";

export const getRecentlyAdded = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyfinClient(config);

  return tool({
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
      try {
        let includeItemTypes = "Movie,Episode";
        if (mediaType === "movies") {
          includeItemTypes = "Movie";
        } else if (mediaType === "shows") {
          includeItemTypes = "Episode";
        }

        const jellyfinUserId = await client.getUserId();

        const params = new URLSearchParams({
          Limit: limit.toString(),
          IncludeItemTypes: includeItemTypes,
          Fields: "Overview,Genres,CommunityRating,DateCreated",
          EnableImages: "true",
        });

        const endpoint = `/Users/${jellyfinUserId}/Items/Latest?${params.toString()}`;

        const response = await client.get<MediaItem[]>(endpoint);

        const results = response.map((item: MediaItem) =>
          mapItem(item, config.baseUrl)
        );

        return {
          results,
          totalResults: results.length,
          message: `Found ${results.length} recently added item(s).`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error getting recently added items: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function mapItem(item: MediaItem, baseUrl: string) {
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
    duration: item.RunTimeTicks ? formatDuration(item.RunTimeTicks) : null,
    imageUrl: getImageUrl(baseUrl, item.Id, item.ImageTags?.Primary),
  };

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
}
