import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import {
  calculateProgressPercentage,
  formatDuration,
  getImageUrl,
  JellyfinClient,
  ticksToMinutes,
} from "./client";
import type { ItemsResponse, MediaItem } from "./types";

export const getContinueWatching = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyfinClient(config);

  return tool({
    description:
      "Get in-progress (partially watched) movies and TV episodes from Jellyfin. Shows content the user has started but not finished watching.",
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(25)
        .default(10)
        .describe("Maximum number of items to return"),
    }),
    execute: async ({ limit }) => {
      try {
        const jellyfinUserId = await getUserId(client);

        const params = new URLSearchParams({
          Limit: limit.toString(),
          MediaTypes: "Video",
          Fields: "Overview,Genres,MediaSources",
          EnableImages: "true",
          EnableUserData: "true",
        });

        const endpoint = `/Users/${jellyfinUserId}/Items/Resume?${params.toString()}`;

        const response = await client.get<ItemsResponse>(endpoint);

        const results = response.Items.map((item: MediaItem) =>
          mapItem(item, config.baseUrl)
        );

        return {
          results,
          totalResults: response.TotalRecordCount,
          message:
            results.length > 0
              ? `Found ${results.length} item(s) to continue watching`
              : "No in-progress content found",
        };
      } catch (error) {
        return {
          results: [],
          message: `Error getting continue watching: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

async function getUserId(client: JellyfinClient): Promise<string> {
  try {
    const usersResponse = await client.get<Array<{ Id: string }>>("/Users");
    if (usersResponse.length > 0) {
      return usersResponse[0].Id;
    }
  } catch {
    // Ignore errors and try /Users/Me
  }
  const userResponse = await client.get<{ Id: string }>("/Users/Me");
  return userResponse.Id;
}

function mapItem(item: MediaItem, baseUrl: string) {
  const positionTicks = item.UserData?.PlaybackPositionTicks ?? 0;
  const totalTicks = item.RunTimeTicks ?? 0;
  const progressPercentage = item.UserData?.PlayedPercentage
    ? Math.round(item.UserData.PlayedPercentage)
    : calculateProgressPercentage(positionTicks, totalTicks);

  const currentPosition = ticksToMinutes(positionTicks);
  const totalDuration = ticksToMinutes(totalTicks);
  const remainingMinutes = totalDuration - currentPosition;

  const base = {
    id: item.Id,
    title: item.Name,
    type: item.Type,
    year: item.ProductionYear,
    progressPercentage,
    currentPosition: `${currentPosition}m`,
    totalDuration: formatDuration(totalTicks),
    remainingTime: `${remainingMinutes}m remaining`,
    lastWatched: item.UserData?.LastPlayedDate
      ? new Date(item.UserData.LastPlayedDate).toLocaleDateString()
      : null,
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
