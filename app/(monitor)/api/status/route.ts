import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { PluginManager } from "@/lib/plugins/core/manager";
import { JellyfinClient } from "@/lib/plugins/jellyfin/client";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { QBittorrentClient } from "@/lib/plugins/qbittorrent/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import type { RadarrQueueItem } from "@/lib/plugins/radarr/types";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import type { SonarrQueueItem } from "@/lib/plugins/sonarr/types";

export const maxDuration = 60;

export interface ServiceStatus {
  configured: boolean;
  enabled: boolean;
  online: boolean;
  error?: string;
}

export interface QueueItem {
  id: number;
  title: string;
  status: string;
  progress: number;
  size: number;
  sizeRemaining: number;
  timeLeft?: string;
  source: string; // "Radarr", "Sonarr"
  subtitle?: string; // Optional subtitle (e.g. season/episode)
}

export interface TorrentItem {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  dlspeed: number;
  upspeed: number;
  eta?: number;
}

export interface PendingRequest {
  id: number;
  title: string;
  requestedBy: string;
  mediaType: string; // "tv" | "movie"
  requestedAt: string; // ISO date string
  status: string;
  image?: string;
}

export interface StalledItem {
  id: number | string;
  title: string;
  errorMessage?: string;
  status: string;
  source: string;
}

export interface MonitorStatus {
  services: {
    radarr: ServiceStatus;
    sonarr: ServiceStatus;
    jellyseerr: ServiceStatus;
    jellyfin: ServiceStatus;
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
    failed: StalledItem[];
    stalled: StalledItem[];
  };
  stats: {
    activeStreams: number;
    pendingRequests: number;
    totalDownloads: number;
  };
}

// Helpers
function mapRadarrQueue(queue: RadarrQueueItem[]): QueueItem[] {
  return queue.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    progress: Math.floor(((item.size - item.sizeleft) / item.size) * 100),
    size: item.size,
    sizeRemaining: item.sizeleft,
    timeLeft: item.timeleft,
    source: "Radarr",
  }));
}

function mapSonarrQueue(queue: SonarrQueueItem[]): QueueItem[] {
  return queue.map((item) => ({
    id: item.id,
    title: item.series?.title || item.title,
    subtitle: item.episode?.title,
    status: item.status,
    progress: Math.floor(((item.size - item.sizeleft) / item.size) * 100),
    size: item.size,
    sizeRemaining: item.sizeleft,
    timeLeft: item.timeleft,
    source: "Sonarr",
  }));
}

// Service Checks returning ServiceStatus + associated data
async function checkRadarrStatus(userId: string) {
  const config = await getServiceConfig({ userId, serviceName: "radarr" });
  if (!config) {
    return {
      status: {
        configured: false,
        enabled: false,
        online: false,
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }
  if (!config.isEnabled) {
    return {
      status: {
        configured: true,
        enabled: false,
        online: false,
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }

  try {
    const client = new RadarrClient(config);
    const queue = await client.getQueue();
    return {
      status: {
        configured: true,
        enabled: true,
        online: true,
      } as ServiceStatus,
      queue: mapRadarrQueue(queue),
    };
  } catch (err) {
    return {
      status: {
        configured: true,
        enabled: true,
        online: false,
        error: err instanceof Error ? err.message : "Connection failed",
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }
}

async function checkSonarrStatus(userId: string) {
  const config = await getServiceConfig({ userId, serviceName: "sonarr" });
  if (!config) {
    return {
      status: {
        configured: false,
        enabled: false,
        online: false,
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }
  if (!config.isEnabled) {
    return {
      status: {
        configured: true,
        enabled: false,
        online: false,
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }

  try {
    const client = new SonarrClient(config);
    const queue = await client.getQueue();
    return {
      status: {
        configured: true,
        enabled: true,
        online: true,
      } as ServiceStatus,
      queue: mapSonarrQueue(queue),
    };
  } catch (err) {
    return {
      status: {
        configured: true,
        enabled: true,
        online: false,
        error: err instanceof Error ? err.message : "Connection failed",
      } as ServiceStatus,
      queue: [] as QueueItem[],
    };
  }
}

async function checkQBittorrentStatus(userId: string) {
  const config = await getServiceConfig({ userId, serviceName: "qbittorrent" });
  if (!config) {
    return {
      status: {
        configured: false,
        enabled: false,
        online: false,
      } as ServiceStatus,
      torrents: [] as TorrentItem[],
    };
  }
  if (!config.isEnabled) {
    return {
      status: {
        configured: true,
        enabled: false,
        online: false,
      } as ServiceStatus,
      torrents: [] as TorrentItem[],
    };
  }

  try {
    const client = new QBittorrentClient(config);
    // biome-ignore lint/suspicious/noExplicitAny: Generic torrent type
    const torrents: any[] = await client.getTorrents();
    return {
      status: {
        configured: true,
        enabled: true,
        online: true,
      } as ServiceStatus,
      // biome-ignore lint/suspicious/noExplicitAny: Generic torrent type mapping
      torrents: torrents.map((t: any) => ({
        hash: t.hash,
        name: t.name,
        state: t.state,
        progress: Number((t.progress * 100).toFixed(1)),
        size: t.size,
        dlspeed: t.dlspeed,
        upspeed: t.upspeed,
        eta: t.eta,
      })),
    };
  } catch (err) {
    return {
      status: {
        configured: true,
        enabled: true,
        online: false,
        error: err instanceof Error ? err.message : "Connection failed",
      } as ServiceStatus,
      torrents: [] as TorrentItem[],
    };
  }
}

async function checkJellyseerrStatus(userId: string) {
  const config = await getServiceConfig({ userId, serviceName: "jellyseerr" });
  if (!config) {
    return {
      status: {
        configured: false,
        enabled: false,
        online: false,
      } as ServiceStatus,
      count: 0,
    };
  }
  if (!config.isEnabled) {
    return {
      status: {
        configured: true,
        enabled: false,
        online: false,
      } as ServiceStatus,
      count: 0,
    };
  }

  try {
    const client = new JellyseerrClient(config);
    await client.getStatus();
    return {
      status: {
        configured: true,
        enabled: true,
        online: true,
      } as ServiceStatus,
      count: 0,
    };
  } catch (err) {
    return {
      status: {
        configured: true,
        enabled: true,
        online: false,
        error: err instanceof Error ? err.message : "Connection failed",
      } as ServiceStatus,
      count: 0,
    };
  }
}

async function checkJellyfinStatus(userId: string) {
  const config = await getServiceConfig({ userId, serviceName: "jellyfin" });
  if (!config) {
    return {
      status: {
        configured: false,
        enabled: false,
        online: false,
      } as ServiceStatus,
      count: 0,
    };
  }
  if (!config.isEnabled) {
    return {
      status: {
        configured: true,
        enabled: false,
        online: false,
      } as ServiceStatus,
      count: 0,
    };
  }

  try {
    const client = new JellyfinClient(config);
    await client.getSystemInfo();
    return {
      status: {
        configured: true,
        enabled: true,
        online: true,
      } as ServiceStatus,
      count: 0,
    };
  } catch (err) {
    return {
      status: {
        configured: true,
        enabled: true,
        online: false,
        error: err instanceof Error ? err.message : "Connection failed",
      } as ServiceStatus,
      count: 0,
    };
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  PluginManager.getInstance();

  const [radarr, sonarr, jellyseerr, jellyfin, qbittorrent] = await Promise.all(
    [
      checkRadarrStatus(userId),
      checkSonarrStatus(userId),
      checkJellyseerrStatus(userId),
      checkJellyfinStatus(userId),
      checkQBittorrentStatus(userId),
    ]
  );

  const status: MonitorStatus = {
    services: {
      radarr: radarr.status,
      sonarr: sonarr.status,
      jellyseerr: jellyseerr.status,
      jellyfin: jellyfin.status,
      qbittorrent: qbittorrent.status,
    },
    queues: {
      radarr: radarr.queue,
      sonarr: sonarr.queue,
    },
    torrents: qbittorrent.torrents,
    requests: {
      pending: [],
    },
    errors: {
      failed: [],
      stalled: [],
    },
    stats: {
      activeStreams: jellyfin.count,
      pendingRequests: jellyseerr.count,
      totalDownloads:
        radarr.queue.length + sonarr.queue.length + qbittorrent.torrents.length,
    },
  };

  return Response.json(status);
}
