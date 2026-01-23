import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import {
  HomeDashboard,
  type ContinueWatchingItem,
  type ForYouData,
} from "@/components/home/home-dashboard";
import { fetchDiscoverySections } from "@/lib/discover/fetch-discovery-sections";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import {
  JellyfinClient,
  calculateProgressPercentage,
  getImageUrl,
  ticksToMinutes,
} from "@/lib/plugins/jellyfin/client";
import type { ItemsResponse, MediaItem } from "@/lib/plugins/jellyfin/types";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <HomePage />
    </Suspense>
  );
}

async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [status, discoverSections, personalized, continueWatching] =
    await Promise.all([
      getMonitorStatus(),
      fetchDiscoverySections(userId),
      getForYouData(),
      getContinueWatching(userId),
    ]);

  return (
    <HomeDashboard
      continueWatching={continueWatching}
      discoverSections={discoverSections}
      personalized={personalized}
      status={status}
      userName={session.user.name ?? session.user.email ?? undefined}
    />
  );
}

async function getMonitorStatus(): Promise<MonitorStatus | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MonitorStatus;
  } catch (_error) {
    return null;
  }
}

async function getForYouData(): Promise<ForYouData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/discover/for-you`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as ForYouData;
  } catch (_error) {
    return null;
  }
}

async function getContinueWatching(
  userId: string
): Promise<ContinueWatchingItem[]> {
  try {
    const config = await getServiceConfig({
      userId,
      serviceName: "jellyfin",
    });

    if (!config?.isEnabled) {
      return [];
    }

    const client = new JellyfinClient(config);
    const jellyfinUserId = await resolveJellyfinUserId(client);

    const params = new URLSearchParams({
      Limit: "8",
      MediaTypes: "Video",
      Fields: "Overview,Genres,MediaSources",
      EnableImages: "true",
      EnableUserData: "true",
    });

    const response = await client.get<ItemsResponse>(
      `/Users/${jellyfinUserId}/Items/Resume?${params.toString()}`
    );

    return response.Items.map((item) =>
      mapContinueWatchingItem(item, config.baseUrl, config.apiKey)
    );
  } catch (_error) {
    return [];
  }
}

async function resolveJellyfinUserId(client: JellyfinClient): Promise<string> {
  try {
    const userResponse = await client.get<{ Id: string }>("/Users/Me");
    return userResponse.Id;
  } catch {
    const usersResponse = await client.get<Array<{ Id: string }>>("/Users");
    const firstUser = usersResponse[0]?.Id;
    if (!firstUser) {
      throw new Error("No users found in Jellyfin");
    }
    return firstUser;
  }
}

function mapContinueWatchingItem(
  item: MediaItem,
  baseUrl: string,
  apiKey?: string
): ContinueWatchingItem {
  const positionTicks = item.UserData?.PlaybackPositionTicks ?? 0;
  const totalTicks = item.RunTimeTicks ?? 0;
  const progressPercentage = item.UserData?.PlayedPercentage
    ? Math.round(item.UserData.PlayedPercentage)
    : calculateProgressPercentage(positionTicks, totalTicks);

  const remainingMinutes = Math.max(
    0,
    ticksToMinutes(totalTicks) - ticksToMinutes(positionTicks)
  );

  const displayTitle =
    item.Type === "Episode" && item.SeriesName
      ? `${item.SeriesName} · S${(item.ParentIndexNumber ?? 0)
          .toString()
          .padStart(2, "0")}E${(item.IndexNumber ?? 0)
          .toString()
          .padStart(2, "0")}`
      : item.Name;

  return {
    id: item.Id,
    title: displayTitle ?? item.Name,
    subtitle:
      item.Type === "Episode" && item.Name
        ? item.Name
        : item.Type === "Movie"
          ? "Movie"
          : item.Type,
    imageUrl: getImageUrl(baseUrl, item.Id, "Primary", 500, apiKey),
    progress: progressPercentage,
    remaining: remainingMinutes ? `${remainingMinutes}m left` : undefined,
    lastWatched: item.UserData?.LastPlayedDate ?? null,
    badge:
      item.Type === "Episode"
        ? "Series"
        : item.Type === "Movie"
          ? "Movie"
          : "Media",
  };
}
