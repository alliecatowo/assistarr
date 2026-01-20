import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getJellyfinConfig,
  jellyfinRequest,
} from "@/lib/ai/tools/services/jellyfin/client";
import {
  getJellyseerrConfig,
  jellyseerrRequest,
} from "@/lib/ai/tools/services/jellyseerr/client";
import type { RequestsResponse } from "@/lib/ai/tools/services/jellyseerr/types";
import {
  getQBittorrentConfig,
  qbittorrentRequest,
} from "@/lib/ai/tools/services/qbittorrent/client";
import type { Torrent } from "@/lib/ai/tools/services/qbittorrent/types";
import {
  getRadarrConfig,
  radarrRequest,
} from "@/lib/ai/tools/services/radarr/client";
import type { RadarrQueueResponse } from "@/lib/ai/tools/services/radarr/types";
import {
  getSonarrConfig,
  sonarrRequest,
} from "@/lib/ai/tools/services/sonarr/client";
import type { SonarrQueueResponse } from "@/lib/ai/tools/services/sonarr/types";

export interface ServiceStatus {
  online: boolean;
  configured: boolean;
  enabled: boolean;
  error?: string;
}

export interface QueueItem {
  id: number;
  title: string;
  subtitle?: string;
  progress: number;
  status: string;
  size: number;
  sizeRemaining: number;
  timeLeft?: string;
  quality?: string;
  downloadClient?: string;
  source: "radarr" | "sonarr";
  errorMessage?: string;
}

export interface PendingRequest {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  requestedBy: string;
  requestedAt: string;
  tmdbId?: number;
}

export interface TorrentItem {
  hash: string;
  name: string;
  progress: number;
  dlspeed: number;
  upspeed: number;
  size: number;
  state: string;
  eta: number;
}

export interface StalledItem {
  id: number;
  title: string;
  source: "radarr" | "sonarr" | "qbittorrent";
  status: string;
  errorMessage?: string;
}

export interface MonitorStatus {
  services: {
    radarr: ServiceStatus;
    sonarr: ServiceStatus;
    jellyfin: ServiceStatus;
    jellyseerr: ServiceStatus;
    qbittorrent: ServiceStatus;
  };
  queues: {
    radarr: QueueItem[];
    sonarr: QueueItem[];
  };
  torrents: TorrentItem[];
  requests: {
    pending: PendingRequest[];
  };
  errors: {
    stalled: StalledItem[];
    failed: StalledItem[];
  };
}

async function checkRadarrStatus(userId: string): Promise<{
  status: ServiceStatus;
  queue: QueueItem[];
  stalled: StalledItem[];
  failed: StalledItem[];
}> {
  const config = await getRadarrConfig(userId);

  if (!config) {
    return {
      status: { online: false, configured: false, enabled: false },
      queue: [],
      stalled: [],
      failed: [],
    };
  }

  if (!config.isEnabled) {
    return {
      status: { online: false, configured: true, enabled: false },
      queue: [],
      stalled: [],
      failed: [],
    };
  }

  try {
    // Check health by fetching system status
    await radarrRequest<{ version: string }>(userId, "/system/status");

    // Fetch queue
    const queueResponse = await radarrRequest<RadarrQueueResponse>(
      userId,
      "/queue?page=1&pageSize=50&includeMovie=true"
    );

    const queue: QueueItem[] = [];
    const stalled: StalledItem[] = [];
    const failed: StalledItem[] = [];

    for (const item of queueResponse.records) {
      const progress =
        item.size > 0
          ? Math.round(((item.size - item.sizeleft) / item.size) * 100)
          : 0;

      const queueItem: QueueItem = {
        id: item.id,
        title: item.movie?.title ?? item.title,
        subtitle: item.movie?.year?.toString(),
        progress,
        status: item.status,
        size: item.size,
        sizeRemaining: item.sizeleft,
        timeLeft: item.timeleft,
        quality: item.quality.quality.name,
        downloadClient: item.downloadClient,
        source: "radarr",
        errorMessage: item.errorMessage,
      };

      queue.push(queueItem);

      // Check for stalled or failed items
      if (
        item.status === "warning" ||
        item.trackedDownloadStatus === "warning"
      ) {
        stalled.push({
          id: item.id,
          title: item.movie?.title ?? item.title,
          source: "radarr",
          status: item.status,
          errorMessage:
            item.errorMessage || item.statusMessages?.[0]?.messages?.[0],
        });
      } else if (item.status === "failed") {
        failed.push({
          id: item.id,
          title: item.movie?.title ?? item.title,
          source: "radarr",
          status: item.status,
          errorMessage:
            item.errorMessage || item.statusMessages?.[0]?.messages?.[0],
        });
      }
    }

    return {
      status: { online: true, configured: true, enabled: true },
      queue,
      stalled,
      failed,
    };
  } catch (error) {
    return {
      status: {
        online: false,
        configured: true,
        enabled: true,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      queue: [],
      stalled: [],
      failed: [],
    };
  }
}

async function checkSonarrStatus(userId: string): Promise<{
  status: ServiceStatus;
  queue: QueueItem[];
  stalled: StalledItem[];
  failed: StalledItem[];
}> {
  const config = await getSonarrConfig(userId);

  if (!config) {
    return {
      status: { online: false, configured: false, enabled: false },
      queue: [],
      stalled: [],
      failed: [],
    };
  }

  if (!config.isEnabled) {
    return {
      status: { online: false, configured: true, enabled: false },
      queue: [],
      stalled: [],
      failed: [],
    };
  }

  try {
    await sonarrRequest<{ version: string }>(userId, "/system/status");

    const queueResponse = await sonarrRequest<SonarrQueueResponse>(
      userId,
      "/queue?page=1&pageSize=50&includeSeries=true&includeEpisode=true"
    );

    const queue: QueueItem[] = [];
    const stalled: StalledItem[] = [];
    const failed: StalledItem[] = [];

    for (const item of queueResponse.records) {
      const progress =
        item.size > 0
          ? Math.round(((item.size - item.sizeleft) / item.size) * 100)
          : 0;

      const episodeInfo = item.episode
        ? `S${String(item.episode.seasonNumber).padStart(2, "0")}E${String(item.episode.episodeNumber).padStart(2, "0")}`
        : "";

      const queueItem: QueueItem = {
        id: item.id,
        title: item.series?.title ?? item.title,
        subtitle: episodeInfo
          ? `${episodeInfo} - ${item.episode?.title ?? ""}`
          : undefined,
        progress,
        status: item.status,
        size: item.size,
        sizeRemaining: item.sizeleft,
        timeLeft: item.timeleft,
        quality: item.quality.quality.name,
        downloadClient: item.downloadClient,
        source: "sonarr",
      };

      queue.push(queueItem);

      if (
        item.status === "warning" ||
        item.trackedDownloadStatus === "warning"
      ) {
        stalled.push({
          id: item.id,
          title: `${item.series?.title ?? item.title} ${episodeInfo}`.trim(),
          source: "sonarr",
          status: item.status,
          errorMessage: item.statusMessages?.[0]?.messages?.[0],
        });
      } else if (item.status === "failed") {
        failed.push({
          id: item.id,
          title: `${item.series?.title ?? item.title} ${episodeInfo}`.trim(),
          source: "sonarr",
          status: item.status,
          errorMessage: item.statusMessages?.[0]?.messages?.[0],
        });
      }
    }

    return {
      status: { online: true, configured: true, enabled: true },
      queue,
      stalled,
      failed,
    };
  } catch (error) {
    return {
      status: {
        online: false,
        configured: true,
        enabled: true,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      queue: [],
      stalled: [],
      failed: [],
    };
  }
}

async function checkJellyfinStatus(userId: string): Promise<ServiceStatus> {
  const config = await getJellyfinConfig(userId);

  if (!config) {
    return { online: false, configured: false, enabled: false };
  }

  if (!config.isEnabled) {
    return { online: false, configured: true, enabled: false };
  }

  try {
    await jellyfinRequest<{ ServerName: string }>(
      { baseUrl: config.baseUrl, apiKey: config.apiKey },
      "/System/Info/Public"
    );
    return { online: true, configured: true, enabled: true };
  } catch (error) {
    return {
      online: false,
      configured: true,
      enabled: true,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkJellyseerrStatus(userId: string): Promise<{
  status: ServiceStatus;
  pendingRequests: PendingRequest[];
}> {
  const config = await getJellyseerrConfig(userId);

  if (!config) {
    return {
      status: { online: false, configured: false, enabled: false },
      pendingRequests: [],
    };
  }

  if (!config.isEnabled) {
    return {
      status: { online: false, configured: true, enabled: false },
      pendingRequests: [],
    };
  }

  try {
    // Check health
    await jellyseerrRequest<{ version: string }>(userId, "/status");

    // Fetch pending requests
    const requestsResponse = await jellyseerrRequest<RequestsResponse>(
      userId,
      "/request?take=20&skip=0&filter=pending&sort=added"
    );

    const pendingRequests: PendingRequest[] = requestsResponse.results.map(
      (request) => ({
        id: request.id,
        title: `Request #${request.id}`,
        mediaType: request.type,
        requestedBy:
          request.requestedBy?.displayName ||
          request.requestedBy?.email ||
          "Unknown",
        requestedAt: request.createdAt,
        tmdbId: request.media?.tmdbId,
      })
    );

    return {
      status: { online: true, configured: true, enabled: true },
      pendingRequests,
    };
  } catch (error) {
    return {
      status: {
        online: false,
        configured: true,
        enabled: true,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      pendingRequests: [],
    };
  }
}

async function checkQBittorrentStatus(userId: string): Promise<{
  status: ServiceStatus;
  torrents: TorrentItem[];
  stalled: StalledItem[];
}> {
  const config = await getQBittorrentConfig(userId);

  if (!config) {
    return {
      status: { online: false, configured: false, enabled: false },
      torrents: [],
      stalled: [],
    };
  }

  if (!config.isEnabled) {
    return {
      status: { online: false, configured: true, enabled: false },
      torrents: [],
      stalled: [],
    };
  }

  try {
    const torrentsData = await qbittorrentRequest<Torrent[]>(
      userId,
      "/torrents/info?filter=active"
    );

    const torrents: TorrentItem[] = [];
    const stalled: StalledItem[] = [];

    for (const torrent of torrentsData) {
      torrents.push({
        hash: torrent.hash,
        name: torrent.name,
        progress: Math.round(torrent.progress * 100),
        dlspeed: torrent.dlspeed,
        upspeed: torrent.upspeed,
        size: torrent.size,
        state: torrent.state,
        eta: torrent.eta,
      });

      // Check for stalled torrents
      if (
        torrent.state === "stalledDL" ||
        torrent.state === "error" ||
        torrent.state === "missingFiles"
      ) {
        stalled.push({
          id: 0, // qBittorrent uses hash as identifier
          title: torrent.name,
          source: "qbittorrent",
          status: torrent.state,
        });
      }
    }

    return {
      status: { online: true, configured: true, enabled: true },
      torrents,
      stalled,
    };
  } catch (error) {
    return {
      status: {
        online: false,
        configured: true,
        enabled: true,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      torrents: [],
      stalled: [],
    };
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch all service statuses in parallel
  const [
    radarrResult,
    sonarrResult,
    jellyfinStatus,
    jellyseerrResult,
    qbittorrentResult,
  ] = await Promise.all([
    checkRadarrStatus(userId),
    checkSonarrStatus(userId),
    checkJellyfinStatus(userId),
    checkJellyseerrStatus(userId),
    checkQBittorrentStatus(userId),
  ]);

  const monitorStatus: MonitorStatus = {
    services: {
      radarr: radarrResult.status,
      sonarr: sonarrResult.status,
      jellyfin: jellyfinStatus,
      jellyseerr: jellyseerrResult.status,
      qbittorrent: qbittorrentResult.status,
    },
    queues: {
      radarr: radarrResult.queue,
      sonarr: sonarrResult.queue,
    },
    torrents: qbittorrentResult.torrents,
    requests: {
      pending: jellyseerrResult.pendingRequests,
    },
    errors: {
      stalled: [
        ...radarrResult.stalled,
        ...sonarrResult.stalled,
        ...qbittorrentResult.stalled,
      ],
      failed: [...radarrResult.failed, ...sonarrResult.failed],
    },
  };

  return NextResponse.json(monitorStatus);
}
