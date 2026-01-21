import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import {
  calculateProgressPercentage,
  formatDuration,
  getImageUrl,
  getJellyfinConfig,
  jellyfinRequest,
  ticksToMinutes,
} from "./client";
import type { ItemsResponse, MediaItem } from "./types";

interface GetContinueWatchingProps {
  session: Session;
}

export const getContinueWatching = ({ session }: GetContinueWatchingProps) =>
  tool({
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
    execute: withToolErrorHandling(
      { serviceName: "Jellyfin", operationName: "get continue watching" },
      async ({ limit }) => {
        const config = await getJellyfinConfig(session.user.id);

        if (!config || !config.isEnabled) {
          return {
            error:
              "Jellyfin is not configured. Please add your Jellyfin settings in the configuration page.",
          };
        }

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
          MediaTypes: "Video",
          Fields: "Overview,Genres,MediaSources",
          EnableImages: "true",
          EnableUserData: "true",
        });

        const endpoint = `/Users/${jellyfinUserId}/Items/Resume?${params.toString()}`;

        const response = await jellyfinRequest<ItemsResponse>(
          { baseUrl: config.baseUrl, apiKey: config.apiKey },
          endpoint
        );

        const results = response.Items.map((item: MediaItem) => {
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
            imageUrl: getImageUrl(
              config.baseUrl,
              item.Id,
              item.ImageTags?.Primary
            ),
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
        });

        return {
          results,
          totalResults: response.TotalRecordCount,
          message:
            results.length > 0
              ? `Found ${results.length} item(s) to continue watching`
              : "No in-progress content found",
        };
      }
    ),
  });
