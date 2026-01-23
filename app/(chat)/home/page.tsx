import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import {
  type ContinueWatchingItem,
  type ForYouData,
  HomeDashboard,
} from "@/components/home/home-dashboard";
import {
  getServiceConfig,
  getServiceConfigs,
} from "@/lib/db/queries/service-config";
import { fetchDiscoverySections } from "@/lib/discover/fetch-discovery-sections";
import {
  calculateProgressPercentage,
  getImageUrl,
  JellyfinClient,
  ticksToMinutes,
} from "@/lib/plugins/jellyfin/client";
import type { ItemsResponse, MediaItem } from "@/lib/plugins/jellyfin/types";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { QBittorrentClient } from "@/lib/plugins/qbittorrent/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import { guestRegex } from "@/lib/shared-constants";

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

  const [discoverSections, personalized, continueWatching] = await Promise.all([
    fetchDiscoverySections(userId),
    getForYouData(),
    getContinueWatching(userId),
  ]);

  const status = await getMonitorStatus(userId);

  const isGuest = guestRegex.test(session.user.email ?? "");
  const userName = isGuest
    ? undefined
    : (session.user.name ?? session.user.email ?? undefined);

  return (
    <HomeDashboard
      continueWatching={continueWatching}
      discoverSections={discoverSections}
      personalized={personalized}
      status={status}
      userName={userName}
    />
  );
}

async function getMonitorStatus(userId: string): Promise<MonitorStatus> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const statusUrl = baseUrl ? `${baseUrl}/api/status` : "/api/status";

  try {
    const res = await fetch(statusUrl, {
      cache: "no-store",
    });
    if (!res.ok) {
      return buildLocalStatus(userId);
    }
    return (await res.json()) as MonitorStatus;
  } catch (_error) {
    return buildLocalStatus(userId);
  }
}

async function buildLocalStatus(userId: string): Promise<MonitorStatus> {
  const allServices = [
    "radarr",
    "sonarr",
    "jellyseerr",
    "jellyfin",
    "qbittorrent",
  ] as const;
  const serviceConfigs = await getServiceConfigs({ userId });

  const configuredMap = new Map<string, (typeof serviceConfigs)[number]>(
    serviceConfigs.map((c) => [c.serviceName, c])
  );

  const services: MonitorStatus["services"] = {
    radarr: { configured: false, enabled: false, online: false },
    sonarr: { configured: false, enabled: false, online: false },
    jellyseerr: { configured: false, enabled: false, online: false },
    jellyfin: { configured: false, enabled: false, online: false },
    qbittorrent: { configured: false, enabled: false, online: false },
  };

  for (const serviceName of allServices) {
    const config = configuredMap.get(serviceName);
    if (config) {
      const online = await checkServiceOnline(serviceName, config);
      services[serviceName] = {
        configured: true,
        enabled: config.isEnabled,
        online,
      };
    }
  }

  return {
    services,
    queues: { radarr: [], sonarr: [] },
    torrents: [],
    requests: { pending: [] },
    errors: { failed: [], stalled: [] },
    stats: {
      activeStreams: 0,
      pendingRequests: 0,
      totalDownloads: 0,
    },
  };
}

async function checkServiceOnline(
  serviceName: string,
  config: NonNullable<Awaited<ReturnType<typeof getServiceConfig>>>
): Promise<boolean> {
  if (!config.isEnabled) {
    return false;
  }

  try {
    switch (serviceName) {
      case "radarr": {
        const client = new RadarrClient(config);
        await client.getQueue();
        return true;
      }
      case "sonarr": {
        const client = new SonarrClient(config);
        await client.getQueue();
        return true;
      }
      case "jellyseerr": {
        const client = new JellyseerrClient(config);
        await client.getStatus();
        return true;
      }
      case "jellyfin": {
        const client = new JellyfinClient(config);
        await client.getSystemInfo();
        return true;
      }
      case "qbittorrent": {
        const client = new QBittorrentClient(config);
        await client.getTorrents();
        return true;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

async function getForYouData(): Promise<ForYouData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const forYouUrl = baseUrl
    ? `${baseUrl}/api/discover/for-you`
    : "/api/discover/for-you";

  try {
    const res = await fetch(forYouUrl, { cache: "no-store" });
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
    const usersResponse = await client.get<Array<{ Id: string }>>("/Users");
    const firstUser = usersResponse[0]?.Id;
    if (firstUser) {
      return firstUser;
    }
  } catch {
    // Ignore errors and try /Users/Me
  }
  const userResponse = await client.get<{ Id: string }>("/Users/Me");
  return userResponse.Id;
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
