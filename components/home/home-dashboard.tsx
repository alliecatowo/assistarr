"use client";

import {
  ActivityIcon,
  ApertureIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  FlameIcon,
  GaugeIcon,
  LibraryIcon,
  MonitorSmartphoneIcon,
  MoonStarIcon,
  PanelTopIcon,
  PlugZapIcon,
  RocketIcon,
  ScanLineIcon,
  SparklesIcon,
  WavesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import type {
  DiscoverItem,
  DiscoverSection,
} from "@/components/discover/discover-context";
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
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetKey[]>(keys);

  useEffect(() => {
    const stored = localStorage.getItem("home.widgets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WidgetKey[];
        const filtered = parsed.filter((key) => keys.includes(key));
        if (filtered.length) {
          setEnabledWidgets(filtered);
        }
      } catch {
        // Ignore invalid localStorage state
      }
    }
  }, [keys]);

  const toggleWidget = (key: WidgetKey) => {
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
  };
}

function HeroSection({
  userName,
  stats,
}: {
  userName?: string;
  stats: ReturnType<typeof computeHeroStats>;
}) {
  const greeting = userName ? `Hey ${userName},` : "Welcome,";

  return (
    <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-6 xl:col-span-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          Assistarr Home
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {greeting} here is your media universe—alive, synced, and
              remixable.
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Everything now in one adaptive canvas.
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/chat/new">
                <RocketIcon className="mr-2 h-4 w-4" />
                Start a chat
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/discover">
                <FlameIcon className="mr-2 h-4 w-4" />
                Discover
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/monitor">
                <MonitorSmartphoneIcon className="mr-2 h-4 w-4" />
                Monitor
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat
            hint="Radarr, Sonarr, Jellyfin, Jellyseerr, qBittorrent"
            icon={GaugeIcon}
            label="Services online"
            value={stats.servicesValue}
          />
          <HeroStat
            hint={stats.libraryHint}
            icon={LibraryIcon}
            label="Library footprint"
            value={stats.libraryValue}
          />
          <HeroStat
            hint="Across Radarr, Sonarr, torrents"
            icon={WavesIcon}
            label="Active downloads"
            value={stats.downloadsValue}
          />
          <HeroStat
            hint="Personalized recs ready"
            icon={SparklesIcon}
            label="AI signals"
            value={stats.aiSignals}
          />
        </div>
      </div>
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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
          {/* Hero */}
          <HeroSection stats={heroStats} userName={userName} />

          {/* Signals & statuses */}
          {isEnabled("signals") && (
            <SignalsWidget queueItems={queueItems} status={status} />
          )}

          {/* Continue Watching */}
          {isEnabled("continueWatching") && (
            <ContinueWatchingWidget continueWatching={continueWatching} />
          )}

          {/* Downloads / queue */}
          {isEnabled("downloads") && (
            <DownloadsWidget queueItems={queueItems} />
          )}

          {/* Discover spotlight */}
          {isEnabled("discover") && (
            <DiscoverWidget highlights={combinedHighlights} />
          )}

          {/* Personalized recommendations */}
          {isEnabled("recommendations") && (
            <RecommendationsWidget
              profile={profile}
              recommendations={recommendations}
            />
          )}

          {/* Plugin deck + layout */}
          {isEnabled("plugins") && (
            <PluginsWidget isEnabled={isEnabled} toggleWidget={toggleWidget} />
          )}
        </div>
      </div>
    </div>
  );
}

function HeroStat({
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
    <div className="flex flex-col gap-1 rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            Fluid, AI-reshuffled blocks
          </p>
        </div>
      </div>
      {actionHref && actionLabel && (
        <Button
          asChild
          className="h-8 rounded-full px-3 text-xs"
          size="sm"
          variant="outline"
        >
          <Link className="flex items-center gap-1" href={actionHref}>
            {actionLabel}
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
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
    <div className="flex flex-col gap-1 rounded-xl border bg-muted/50 p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <span className="capitalize">{label}</span>
        <span
          className={cn(
            "flex h-2.5 w-2.5 rounded-full",
            configured
              ? online
                ? "bg-emerald-500"
                : "bg-amber-500"
              : "bg-muted-foreground/50"
          )}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {error ? error : statusLabel}
      </p>
    </div>
  );
}

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
  return (
    <div className="group relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-muted/40 shadow-sm">
      <div className="relative h-36 w-full overflow-hidden">
        {item.imageUrl ? (
          <Image
            alt={item.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="240px"
            src={item.imageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <PanelTopIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] font-medium text-white">
          {item.badge && (
            <span className="rounded-full bg-white/20 px-2 py-0.5">
              {item.badge}
            </span>
          )}
          {item.remaining && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 backdrop-blur">
              {item.remaining}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.subtitle}
          </p>
        )}
        <Progress
          className="h-2"
          value={Math.min(100, Math.max(0, item.progress))}
        />
        {item.lastWatched && (
          <p className="text-[11px] text-muted-foreground">
            Last watched: {new Date(item.lastWatched).toLocaleDateString()}
          </p>
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
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-inner">
        <ActivityIcon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium line-clamp-1">{item.title}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="line-clamp-1">
            {item.subtitle || "Queued source"}
          </span>
          {item.badge && (
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px]">
              {item.badge}
            </span>
          )}
        </div>
        <Progress className="h-2" value={Math.min(100, item.progress)} />
      </div>
    </div>
  );
}

function DiscoverTile({ item }: { item: DiscoverItem }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-muted/50">
      <div className="relative h-44 w-full overflow-hidden">
        {item.posterUrl ? (
          <Image
            alt={item.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="180px"
            src={item.posterUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MoonStarIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[11px] capitalize">
          {item.mediaType}
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {item.title}
        </p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{item.year ?? "—"}</span>
          {item.status !== "unavailable" && (
            <span className="rounded-full bg-background px-2 py-0.5 capitalize">
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
    <div className="rounded-xl border bg-muted/50 p-3">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="line-clamp-1">{item.title}</span>
        {item.reason && (
          <Badge className="bg-primary/15 text-primary" variant="outline">
            AI pick
          </Badge>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
        {item.reason ?? "Based on your library footprint"}
      </p>
    </div>
  );
}

function TasteProfile({ profile }: { profile: ForYouProfile }) {
  return (
    <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GaugeIcon className="h-4 w-4 text-primary" />
          Taste graph
        </div>
        <Badge variant="secondary">
          {Math.round(profile.genreDiversityScore)}% eclectic
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground">
            Favorite genres
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.topGenres.slice(0, 3).map((genre) => (
              <span
                className="rounded-full bg-background px-2 py-0.5"
                key={genre.genre}
              >
                {genre.genre} · {genre.percentage.toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground">
            Decade bias
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.favoriteDecades.slice(0, 2).map((decade) => (
              <span
                className="rounded-full bg-background px-2 py-0.5"
                key={decade.decade}
              >
                {decade.decade}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
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
          <p>avg rating</p>
        </div>
      </div>
    </div>
  );
}

function MutedBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// Widget section components to reduce cognitive complexity

function SignalsWidget({
  status,
  queueItems,
}: {
  status: MonitorStatus | null;
  queueItems: Array<{ id: string; progress: number }>;
}) {
  return (
    <div className="col-span-1 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-4">
      <SectionHeader
        actionHref="/monitor"
        actionLabel="Open monitor"
        icon={ApertureIcon}
        title="Signals & Status"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
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
          <MutedBlock message="Connect services to light up signals" />
        )}
      </div>
      <div className="mt-4 space-y-2 rounded-xl border bg-muted/60 p-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Live pipelines</span>
          <Badge variant="secondary">{queueItems.length} in flight</Badge>
        </div>
        <Progress value={Math.min(100, queueItems[0]?.progress ?? 12)} />
        <p className="text-xs text-muted-foreground">
          Tracking downloads, requests, and transcodes across providers.
        </p>
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
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-7">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Jump to player"
        icon={WavesIcon}
        title="Continue watching"
      />
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {continueWatching.length > 0 ? (
          continueWatching.map((item) => (
            <ContinueCard item={item} key={item.id} />
          ))
        ) : (
          <MutedBlock message="No in-progress sessions. Press play or connect Jellyfin to populate this lane." />
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
    <div className="col-span-1 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-5">
      <SectionHeader
        actionHref="/monitor"
        actionLabel="Inspect"
        icon={ScanLineIcon}
        title="Pipelines & queue"
      />
      <div className="mt-4 space-y-3">
        {queueItems.length ? (
          queueItems.map((item) => <QueueRow item={item} key={item.id} />)
        ) : (
          <MutedBlock message="Nothing queued. When Radarr, Sonarr or torrents spin up, you'll see them pulse here." />
        )}
      </div>
    </div>
  );
}

function DiscoverWidget({ highlights }: { highlights: DiscoverItem[] }) {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-8">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Open discover"
        icon={FlameIcon}
        title="Discover spotlight"
      />
      {highlights.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {highlights.map((item) => (
            <DiscoverTile item={item} key={`${item.id}-${item.title}`} />
          ))}
        </div>
      ) : (
        <MutedBlock message="Connect Jellyseerr to pull trending and upcoming picks." />
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
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-4">
      <SectionHeader
        actionHref="/discover"
        actionLabel="Refine"
        icon={SparklesIcon}
        title="Personalized AI"
      />
      {profile ? (
        <div className="mt-3 space-y-4">
          <TasteProfile profile={profile} />
          <div className="space-y-2">
            {(recommendations || []).slice(0, 3).map((rec) => (
              <Recommendation item={rec} key={rec.id} />
            ))}
          </div>
        </div>
      ) : (
        <MutedBlock message="Add a library to unlock AI taste-mapping and instant picks." />
      )}
    </div>
  );
}

function PluginsWidget({
  isEnabled,
  toggleWidget,
}: {
  isEnabled: (key: WidgetKey) => boolean;
  toggleWidget: (key: WidgetKey) => void;
}) {
  return (
    <div className="col-span-1 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-5">
      <SectionHeader
        actionHref="/settings"
        actionLabel="Configure"
        icon={PlugZapIcon}
        title="Plugin deck"
      />
      <p className="mt-2 text-sm text-muted-foreground">
        AI-native widgets from your stack. Toggle to remix the canvas on the
        fly.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {WIDGETS.map((widget) => (
          <button
            className={cn(
              "group relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-all",
              "hover:-translate-y-0.5 hover:shadow-md",
              isEnabled(widget.key)
                ? "border-primary/50 bg-gradient-to-br from-primary/10 to-transparent"
                : "bg-muted/60"
            )}
            key={widget.key}
            onClick={() => toggleWidget(widget.key)}
            type="button"
          >
            <div
              className={cn(
                "absolute inset-0 opacity-60 transition-opacity",
                `bg-gradient-to-br ${widget.tone}`,
                !isEnabled(widget.key) && "opacity-0"
              )}
            />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{widget.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isEnabled(widget.key) ? "Pinned to home" : "Tap to surface"}
                </p>
              </div>
              <Badge
                className={cn(
                  "border-none text-[11px]",
                  isEnabled(widget.key)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {isEnabled(widget.key) ? "On" : "Off"}
              </Badge>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border bg-muted/50 p-3 text-xs text-muted-foreground">
        <BadgeCheckIcon className="h-4 w-4 text-primary" />
        Layout saves locally per device. Plugins broadcast richer blocks as they
        come online—no refresh required.
      </div>
    </div>
  );
}
