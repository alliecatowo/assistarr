"use client";

import {
  ActivityIcon,
  ApertureIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BookOpenIcon,
  FlameIcon,
  GaugeIcon,
  LibraryIcon,
  MoonStarIcon,
  PanelTopIcon,
  PlayIcon,
  PlugZapIcon,
  RocketIcon,
  ScanLineIcon,
  SparklesIcon,
  WavesIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ComponentType, useMemo, useState } from "react";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import type {
  DiscoverItem,
  DiscoverSection,
} from "@/components/discover/discover-context";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ContinueWatchingItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  progress: number;
  remaining?: string;
  lastWatched?: string | null;
  badge?: string;
  jellyfinBaseUrl?: string;
};

export type ForYouProfile = {
  topGenres: { genre: string; percentage: number; count: number }[];
  favoriteDecades: { decade: string; percentage: number; count: number }[];
  totalItems: number;
  totalMovies: number;
  totalShows: number;
  totalRuntimeHours: number;
  totalSizeGB: number;
  averageRating: number;
  genreDiversityScore: number;
};

export type ForYouData = {
  recommendations: Array<DiscoverItem & { reason?: string }>;
  profile: ForYouProfile | null;
  message?: string;
  error?: string;
};

interface HomeDashboardProps {
  status: MonitorStatus | null;
  discoverSections: DiscoverSection[];
  personalized: ForYouData | null;
  continueWatching: ContinueWatchingItem[];
  userName?: string;
}

type WidgetKey =
  | "continueWatching"
  | "discover"
  | "recommendations"
  | "signals"
  | "downloads"
  | "plugins";

const WIDGETS: Array<{ key: WidgetKey; label: string; tone: string }> = [
  {
    key: "continueWatching",
    label: "Continue Watching",
    tone: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    key: "discover",
    label: "Discover Spotlight",
    tone: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    key: "recommendations",
    label: "Personalized AI",
    tone: "from-amber-500/20 to-amber-500/5",
  },
  {
    key: "signals",
    label: "Signals & Uptime",
    tone: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    key: "downloads",
    label: "Pipelines",
    tone: "from-pink-500/20 to-pink-500/5",
  },
  {
    key: "plugins",
    label: "Plugin Deck",
    tone: "from-slate-500/20 to-slate-500/5",
  },
];

function useWidgetPreferences(keys: WidgetKey[]) {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetKey[]>(() => {
    if (typeof window === "undefined") {
      return keys;
    }
    const stored = localStorage.getItem("home.widgets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WidgetKey[];
        const filtered = parsed.filter((key) => keys.includes(key));
        if (filtered.length) {
          return filtered;
        }
      } catch {
        return keys;
      }
    }
    return keys;
  });

  const toggleWidget = (key: WidgetKey) => {
    if (key === "plugins") {
      return;
    }
    setEnabledWidgets((prev) => {
      const next = prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key];
      localStorage.setItem("home.widgets", JSON.stringify(next));
      return next;
    });
  };

  const isEnabled = (key: WidgetKey) => enabledWidgets.includes(key);

  return { enabledWidgets, toggleWidget, isEnabled };
}

function buildQueueItems(status: MonitorStatus | null) {
  if (!status) {
    return [];
  }

  const radarrQueue =
    status.queues?.radarr.map((item) => ({
      id: `radarr-${item.id}`,
      title: item.title,
      subtitle: item.source,
      progress: item.progress,
      badge: "Radarr",
    })) ?? [];

  const sonarrQueue =
    status.queues?.sonarr.map((item) => ({
      id: `sonarr-${item.id}`,
      title: item.title,
      subtitle: item.subtitle ?? item.source,
      progress: item.progress,
      badge: "Sonarr",
    })) ?? [];

  const torrents =
    status.torrents?.map((torrent) => ({
      id: `torrent-${torrent.hash}`,
      title: torrent.name,
      subtitle: torrent.state,
      progress: Math.round(torrent.progress),
      badge: "qBittorrent",
    })) ?? [];

  return [...radarrQueue, ...sonarrQueue, ...torrents].slice(0, 6);
}

function computeHeroStats(
  status: MonitorStatus | null,
  profile: ForYouProfile | null,
  discoverSections: DiscoverSection[],
  queueItemsLength: number,
  recommendationsLength: number
) {
  const servicesValue = status
    ? `${Object.values(status.services).filter((s) => s.online).length}/${Object.keys(status.services).length}`
    : "—";

  const libraryValue = profile
    ? `${profile.totalItems} items`
    : discoverSections.length
      ? "Ready"
      : "Configure services";

  const libraryHint = profile
    ? `${profile.totalMovies} films · ${profile.totalShows} series`
    : "Add Radarr/Sonarr for richer stats";

  const downloadsValue = status
    ? `${status.stats.totalDownloads ?? queueItemsLength}`
    : queueItemsLength;

  return {
    servicesValue,
    libraryValue,
    libraryHint,
    downloadsValue,
    aiSignals: recommendationsLength,
    activeStreams: status?.stats.activeStreams ?? 0,
    pendingRequests: status?.stats.pendingRequests ?? 0,
  };
}

function HeroSection({ userName }: { userName?: string }) {
  const greeting = userName ? `Hey ${userName},` : "Welcome,";

  return (
    <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          Home
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {greeting} here is your media universe—alive, synced, and remixable.
          </p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Your media, all in one place.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/chat/new">
              <RocketIcon className="mr-2 h-4 w-4" />
              Start a chat
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/discover">
              <FlameIcon className="mr-2 h-4 w-4" />
              Discover
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickStatsWidget({
  stats,
}: {
  stats: ReturnType<typeof computeHeroStats>;
}) {
  return (
    <div className="col-span-1 row-span-2 rounded-3xl border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-2">
      <SectionHeader icon={GaugeIcon} title="At a Glance" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          hint="Radarr, Sonarr, Jellyfin"
          icon={ActivityIcon}
          label="Services"
          value={stats.servicesValue}
        />
        <StatCard
          hint={stats.libraryHint}
          icon={LibraryIcon}
          label="Library"
          value={stats.libraryValue}
        />
        <StatCard
          hint="Active streams"
          icon={WavesIcon}
          label="Watching"
          value={stats.activeStreams.toString()}
        />
        <StatCard
          hint="Pending requests"
          icon={BookOpenIcon}
          label="Requests"
          value={stats.pendingRequests.toString()}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div
      className="flex flex-col justify-between rounded-2xl border bg-muted/50 p-3"
      title={hint}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export function HomeDashboard({
  status,
  discoverSections,
  personalized,
  continueWatching,
  userName,
}: HomeDashboardProps) {
  const { isEnabled, toggleWidget } = useWidgetPreferences(
    WIDGETS.map((widget) => widget.key)
  );

  const combinedHighlights = useMemo(() => {
    const combined = discoverSections.flatMap((section) => section.items);
    return combined.slice(0, 8);
  }, [discoverSections]);

  const queueItems = useMemo(() => buildQueueItems(status), [status]);

  const profile = personalized?.profile ?? null;
  const recommendations = personalized?.recommendations ?? [];

  const heroStats = useMemo(
    () =>
      computeHeroStats(
        status,
        profile,
        discoverSections,
        queueItems.length,
        recommendations.length
      ),
    [
      status,
      profile,
      discoverSections,
      queueItems.length,
      recommendations.length,
    ]
  );

  return (
    <div className="relative isolate flex-1 overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
        <div className="absolute left-10 top-6 h-48 w-48 rounded-full bg-indigo-500/20" />
        <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-emerald-500/20" />
        <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-amber-500/20" />
      </div>

      <header className="sticky top-0 z-10 flex items-center gap-2 bg-background/80 px-4 py-2 backdrop-blur-sm sm:px-6">
        <SidebarToggle />
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 sm:px-6">
        <div className="grid grid-auto-rows gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <HeroSection userName={userName} />
          <QuickStatsWidget stats={heroStats} />

          {isEnabled("continueWatching") && (
            <ContinueWatchingWidget continueWatching={continueWatching} />
          )}

          {isEnabled("downloads") && (
            <DownloadsWidget queueItems={queueItems} />
          )}

          {isEnabled("signals") && (
            <SignalsWidget queueItems={queueItems} status={status} />
          )}

          {isEnabled("discover") && (
            <DiscoverWidget highlights={combinedHighlights} />
          )}

          {isEnabled("recommendations") && (
            <RecommendationsWidget
              profile={profile}
              recommendations={recommendations}
            />
          )}

          {isEnabled("plugins") && (
            <PluginsWidget isEnabled={isEnabled} toggleWidget={toggleWidget} />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {actionHref && actionLabel && (
        <Button
          asChild
          className="h-7 rounded-full px-3 text-[10px]"
          size="sm"
          variant="ghost"
        >
          <Link className="flex items-center gap-1" href={actionHref}>
            {actionLabel}
            <ArrowUpRightIcon className="h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function ServicePill({
  label,
  online,
  configured,
  error,
}: {
  label: string;
  online: boolean;
  configured: boolean;
  error?: string;
}) {
  const statusLabel = configured
    ? online
      ? "Online"
      : "Offline"
    : "Not configured";

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-2.5 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <span className="capitalize">{label}</span>
        <span
          className={cn(
            "flex h-2 w-2 rounded-full",
            configured
              ? online
                ? "bg-emerald-500"
                : "bg-amber-500"
              : "bg-muted-foreground/50"
          )}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {error ? error : statusLabel}
      </p>
    </div>
  );
}

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
  const watchUrl = item.jellyfinBaseUrl
    ? `${item.jellyfinBaseUrl}/web/index.html#!/details?id=${item.id}`
    : null;

  return (
    <div className="relative flex w-[160px] shrink-0 flex-col overflow-hidden rounded-xl border bg-muted/40 shadow-sm">
      <div className="relative h-24 w-full overflow-hidden">
        {item.imageUrl ? (
          <Image
            alt={item.title}
            className="object-cover"
            fill
            sizes="160px"
            src={item.imageUrl}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <PanelTopIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 text-[10px] font-medium text-white">
          {item.badge && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5">
              {item.badge}
            </span>
          )}
          {item.remaining && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 backdrop-blur">
              {item.remaining}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1 p-2.5">
        <p className="text-xs font-semibold leading-tight line-clamp-2">
          {item.title}
        </p>
        <Progress
          className="h-1.5"
          value={Math.min(100, Math.max(0, item.progress))}
        />
        {watchUrl && (
          <Button
            asChild
            className="mt-1 h-6 w-full text-[10px]"
            size="sm"
            variant="secondary"
          >
            <a href={watchUrl} rel="noopener noreferrer" target="_blank">
              <PlayIcon className="size-3 mr-1" />
              Watch
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function QueueRow({
  item,
}: {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    progress: number;
    badge?: string;
  };
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/40 p-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-inner">
        <ActivityIcon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium line-clamp-1">{item.title}</p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="line-clamp-1">
            {item.subtitle || "Queued source"}
          </span>
          {item.badge && (
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[9px]">
              {item.badge}
            </span>
          )}
        </div>
        <Progress className="h-1.5" value={Math.min(100, item.progress)} />
      </div>
    </div>
  );
}

function DiscoverTile({ item }: { item: DiscoverItem }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/50">
      <div className="relative h-32 w-full overflow-hidden">
        {item.posterUrl ? (
          <Image
            alt={item.title}
            className="object-cover"
            fill
            sizes="140px"
            src={item.posterUrl}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MoonStarIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute right-1.5 top-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] capitalize">
          {item.mediaType}
        </div>
      </div>
      <div className="space-y-1 p-2.5">
        <p className="text-xs font-semibold leading-tight line-clamp-2">
          {item.title}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{item.year ?? "—"}</span>
          {item.status !== "unavailable" && (
            <span className="rounded-full bg-background px-1.5 py-0.5 capitalize text-[9px]">
              {item.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Recommendation({
  item,
}: {
  item: DiscoverItem & { reason?: string };
}) {
  return (
    <div className="rounded-lg border bg-muted/50 p-2.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="line-clamp-1">{item.title}</span>
        {item.reason && (
          <Badge className="bg-primary/15 text-primary" variant="outline">
            AI
          </Badge>
        )}
      </div>
      {item.reason && (
        <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
          {item.reason}
        </p>
      )}
    </div>
  );
}

function TasteProfile({ profile }: { profile: ForYouProfile }) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <GaugeIcon className="h-3.5 w-3.5 text-primary" />
          Taste graph
        </div>
        <Badge className="text-[10px]" variant="secondary">
          {Math.round(profile.genreDiversityScore)}% eclectic
        </Badge>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase text-muted-foreground">
          Top genres
        </p>
        <div className="flex flex-wrap gap-1">
          {profile.topGenres.slice(0, 3).map((genre) => (
            <span
              className="rounded-full bg-background px-2 py-0.5 text-[10px]"
              key={genre.genre}
            >
              {genre.genre}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">
            {profile.totalItems.toLocaleString()}
          </p>
          <p>items</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {profile.totalRuntimeHours}h
          </p>
          <p>runtime</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {profile.averageRating.toFixed(1)}
          </p>
          <p>rating</p>
        </div>
      </div>
    </div>
  );
}

function MutedBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed bg-muted/40 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function SignalsWidget({
  status,
  queueItems,
}: {
  status: MonitorStatus | null;
  queueItems: Array<{ id: string; progress: number }>;
}) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <SectionHeader
        actionHref="/monitor"
        actionLabel="Monitor"
        icon={ApertureIcon}
        title="Signals"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {status ? (
          Object.entries(status.services).map(([key, service]) => (
            <ServicePill
              configured={service.configured}
              error={service.error}
              key={key}
              label={key}
              online={service.online}
            />
          ))
        ) : (
          <MutedBlock message="Connect services" />
        )}
      </div>
      <div className="mt-3 space-y-2 rounded-lg border bg-muted/60 p-2.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>Downloads</span>
          <Badge variant="secondary">{queueItems.length} active</Badge>
        </div>
        <Progress value={Math.min(100, queueItems[0]?.progress ?? 12)} />
      </div>
    </div>
  );
}

function ContinueWatchingWidget({
  continueWatching,
}: {
  continueWatching: ContinueWatchingItem[];
}) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Player"
        icon={WavesIcon}
        title="Continue Watching"
      />
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {continueWatching.length > 0 ? (
          continueWatching.map((item) => (
            <ContinueCard item={item} key={item.id} />
          ))
        ) : (
          <MutedBlock message="No in-progress sessions. Connect Jellyfin to populate." />
        )}
      </div>
    </div>
  );
}

function DownloadsWidget({
  queueItems,
}: {
  queueItems: Array<{
    id: string;
    title: string;
    subtitle?: string;
    progress: number;
    badge?: string;
  }>;
}) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <SectionHeader
        actionHref="/monitor"
        actionLabel="Inspect"
        icon={ScanLineIcon}
        title="Queue"
      />
      <div className="mt-3 space-y-2">
        {queueItems.length ? (
          queueItems.map((item) => <QueueRow item={item} key={item.id} />)
        ) : (
          <MutedBlock message="Nothing queued." />
        )}
      </div>
      {queueItems.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-2.5 text-[10px] text-muted-foreground">
          <ZapIcon className="h-3.5 w-3.5 text-primary" />
          Tracking downloads across Radarr, Sonarr, torrents
        </div>
      )}
    </div>
  );
}

function DiscoverWidget({ highlights }: { highlights: DiscoverItem[] }) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Open"
        icon={FlameIcon}
        title="Discover"
      />
      {highlights.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {highlights.slice(0, 4).map((item) => (
            <DiscoverTile item={item} key={`${item.id}-${item.title}`} />
          ))}
        </div>
      ) : (
        <MutedBlock message="Connect Jellyseerr for trending picks." />
      )}
    </div>
  );
}

function RecommendationsWidget({
  profile,
  recommendations,
}: {
  profile: ForYouProfile | null;
  recommendations: Array<DiscoverItem & { reason?: string }>;
}) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Refine"
        icon={SparklesIcon}
        title="AI Picks"
      />
      {profile ? (
        <div className="mt-3 space-y-3">
          <TasteProfile profile={profile} />
          <div className="space-y-2">
            {(recommendations || []).slice(0, 3).map((rec) => (
              <Recommendation item={rec} key={rec.id} />
            ))}
          </div>
        </div>
      ) : (
        <MutedBlock message="Add a library to unlock recommendations." />
      )}
    </div>
  );
}

function PluginToggleButton({
  disabled,
  onClick,
  status,
  widget,
}: {
  disabled: boolean;
  onClick: () => void;
  status: { label: string; status: string };
  widget: { key: WidgetKey; label: string; tone: string };
}) {
  const isActive = status.status === "on" || status.status === "always-on";
  return (
    <button
      className={cn(
        "group relative overflow-hidden rounded-lg border px-2 py-2 text-left transition-all",
        !disabled && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        disabled && "cursor-default",
        isActive
          ? "border-primary/50 bg-gradient-to-br from-primary/10 to-transparent"
          : "bg-muted/60"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div
        className={cn(
          "absolute inset-0 opacity-60 transition-opacity",
          `bg-gradient-to-br ${widget.tone}`,
          !isActive && "opacity-0"
        )}
      />
      <div className="relative flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium">{widget.label}</p>
          <p className="text-[9px] text-muted-foreground">{status.label}</p>
        </div>
        <Badge
          className={cn(
            "border-none text-[9px]",
            status.status === "always-on"
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
          )}
        >
          {status.label}
        </Badge>
      </div>
    </button>
  );
}

function PluginsWidget({
  isEnabled,
  toggleWidget,
}: {
  isEnabled: (key: WidgetKey) => boolean;
  toggleWidget: (key: WidgetKey) => void;
}) {
  const getWidgetStatus = (key: WidgetKey) => {
    if (key === "plugins") {
      return { label: "On", status: "always-on" };
    }
    return isEnabled(key)
      ? { label: "On", status: "on" }
      : { label: "Off", status: "off" };
  };

  const isDisabled = (key: WidgetKey) => key === "plugins";

  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-6">
      <SectionHeader
        actionHref="/settings"
        actionLabel="Settings"
        icon={PlugZapIcon}
        title="Plugin Deck"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Toggle widgets from your services.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {WIDGETS.map((widget) => {
          const disabled = isDisabled(widget.key);
          const status = getWidgetStatus(widget.key);
          return (
            <PluginToggleButton
              disabled={disabled}
              key={widget.key}
              onClick={() => toggleWidget(widget.key)}
              status={status}
              widget={widget}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-2.5 text-[10px] text-muted-foreground">
        <BadgeCheckIcon className="h-3.5 w-3.5 text-primary" />
        Layout saves locally. Plugins broadcast richer blocks as they come
        online.
      </div>
    </div>
  );
}
