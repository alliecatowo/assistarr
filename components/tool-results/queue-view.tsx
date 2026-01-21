"use client";

import {
  AlertCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  FilmIcon,
  HardDriveIcon,
  PauseIcon,
  TvIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ArrQueueItem,
  ArrQueueShape,
  ToolResultProps,
  TorrentItem,
  TorrentQueueShape,
} from "./types";

/**
 * Parse progress string to number (e.g., "45%" -> 45, "45.5%" -> 45.5)
 */
function parseProgress(progress: string): number {
  const match = progress.match(/^([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

/**
 * Get status color based on status string
 */
function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("download") || s.includes("dl")) {
    return "text-blue-500";
  }
  if (s.includes("seed") || s.includes("upload") || s.includes("up")) {
    return "text-green-500";
  }
  if (s.includes("pause")) {
    return "text-yellow-500";
  }
  if (s.includes("stall")) {
    return "text-orange-400";
  }
  if (s.includes("error") || s.includes("warning")) {
    return "text-red-500";
  }
  if (s.includes("complet") || s.includes("done")) {
    return "text-green-500";
  }
  if (s.includes("queue") || s.includes("wait")) {
    return "text-muted-foreground";
  }
  return "text-muted-foreground";
}

/**
 * Get progress bar color based on progress percentage
 */
function getProgressColor(progress: number, status: string): string {
  const s = status.toLowerCase();
  if (s.includes("error")) {
    return "bg-red-500";
  }
  if (s.includes("stall")) {
    return "bg-orange-400";
  }
  if (s.includes("pause")) {
    return "bg-yellow-500";
  }
  if (progress >= 100) {
    return "bg-green-500";
  }
  return "bg-blue-500";
}

/**
 * Progress bar component
 */
function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  const color = getProgressColor(progress, status);

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "absolute left-0 top-0 h-full transition-all duration-300",
          color
        )}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

/**
 * Radarr/Sonarr queue item component
 */
function ArrQueueEntry({ item }: { item: ArrQueueItem }) {
  const isMovie = !!item.movieTitle;
  const title = item.movieTitle || item.seriesTitle || "Unknown";
  const subtitle = isMovie
    ? item.movieYear
      ? `(${item.movieYear})`
      : ""
    : item.episodeTitle
      ? `S${String(item.seasonNumber || 0).padStart(2, "0")}E${String(item.episodeNumber || 0).padStart(2, "0")} - ${item.episodeTitle}`
      : "";

  const progress = parseProgress(item.progress);
  const statusColor = getStatusColor(item.status);
  const hasError = !!item.errorMessage;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        hasError && "border-red-500/50 bg-red-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isMovie
              ? "bg-primary/10 text-primary"
              : "bg-blue-500/10 text-blue-500"
          )}
        >
          {isMovie ? (
            <FilmIcon className="size-4" />
          ) : (
            <TvIcon className="size-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
              {subtitle && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
            <span className={cn("text-xs font-medium shrink-0", statusColor)}>
              {item.status}
            </span>
          </div>

          {/* Progress */}
          <div className="mt-2 space-y-1">
            <ProgressBar progress={progress} status={item.status} />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {item.progress} of {item.size}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {item.timeLeft}
              </span>
            </div>
          </div>

          {/* Quality & Client */}
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5">
              {item.quality}
            </span>
            {item.downloadClient && <span>{item.downloadClient}</span>}
          </div>

          {/* Error message */}
          {hasError && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
              <AlertCircleIcon className="size-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{item.errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * qBittorrent torrent item component
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: View logic is complex
function TorrentEntry({ item }: { item: TorrentItem }) {
  const progress = item.progressValue * 100;
  const statusColor = getStatusColor(item.state);
  const isPaused = item.rawState.toLowerCase().includes("pause");
  const isSeeding =
    item.rawState.toLowerCase().includes("up") ||
    item.rawState.toLowerCase().includes("seed");
  const isDownloading =
    item.rawState.toLowerCase().includes("dl") ||
    item.rawState.toLowerCase().includes("download");

  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isSeeding
              ? "bg-green-500/10 text-green-500"
              : isDownloading
                ? "bg-blue-500/10 text-blue-500"
                : isPaused
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-muted text-muted-foreground"
          )}
        >
          {isSeeding ? (
            <UploadIcon className="size-4" />
          ) : isDownloading ? (
            <DownloadIcon className="size-4" />
          ) : isPaused ? (
            <PauseIcon className="size-4" />
          ) : (
            <HardDriveIcon className="size-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-1" title={item.name}>
              {item.name}
            </h4>
            <span
              className={cn(
                "text-xs font-medium shrink-0 capitalize",
                statusColor
              )}
            >
              {item.state}
            </span>
          </div>

          {/* Progress */}
          <div className="mt-2 space-y-1">
            <ProgressBar progress={progress} status={item.rawState} />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {item.progress} ({item.downloaded} / {item.size})
              </span>
              {!isSeeding && item.eta !== "Unknown" && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {item.eta}
                </span>
              )}
            </div>
          </div>

          {/* Speeds & Stats */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            {isDownloading && (
              <span className="flex items-center gap-1 text-blue-400">
                <DownloadIcon className="size-3" />
                {item.downloadSpeed}
              </span>
            )}
            {isSeeding && (
              <span className="flex items-center gap-1 text-green-400">
                <UploadIcon className="size-3" />
                {item.uploadSpeed}
              </span>
            )}
            <span>Ratio: {item.ratio}</span>
            <span>Seeds: {item.seeds}</span>
            <span>Peers: {item.peers}</span>
            {item.category && (
              <span className="rounded bg-muted px-1.5 py-0.5">
                {item.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Initial items to display before "Load More" */
const INITIAL_DISPLAY_COUNT = 10;
/** Items to load per "Load More" click */
const PAGE_SIZE = 10;

/**
 * Arr queue view (Radarr/Sonarr)
 */
export function ArrQueueView({ output }: ToolResultProps<ArrQueueShape>) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const { visibleItems, hasMore, remaining } = useMemo(() => {
    if (!output || !output.items || output.items.length === 0) {
      return { visibleItems: [], hasMore: false, remaining: 0 };
    }

    const all = output.items;
    const visible = all.slice(0, displayCount);
    const more = all.length > displayCount;
    const rem = all.length - displayCount;

    return { visibleItems: visible, hasMore: more, remaining: rem };
  }, [output, displayCount]);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  if (!output || !output.items || output.items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No items in the download queue."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {output.message && (
        <p className="text-xs text-muted-foreground">{output.message}</p>
      )}
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <ArrQueueEntry item={item} key={item.id} />
        ))}
      </div>
      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          <Button
            className="w-full max-w-xs"
            onClick={handleLoadMore}
            size="sm"
            variant="ghost"
          >
            <ChevronDownIcon className="size-4 mr-1" />
            Load {Math.min(PAGE_SIZE, remaining)} more ({remaining} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Torrent queue view (qBittorrent)
 */
export function TorrentQueueView({
  output,
}: ToolResultProps<TorrentQueueShape>) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const { visibleTorrents, hasMore, remaining } = useMemo(() => {
    if (!output || !output.torrents || output.torrents.length === 0) {
      return { visibleTorrents: [], hasMore: false, remaining: 0 };
    }

    const all = output.torrents;
    const visible = all.slice(0, displayCount);
    const more = all.length > displayCount;
    const rem = all.length - displayCount;

    return { visibleTorrents: visible, hasMore: more, remaining: rem };
  }, [output, displayCount]);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  if (!output || !output.torrents || output.torrents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No torrents found."}
      </div>
    );
  }

  const { summary } = output;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {summary && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            {summary.total} torrents
          </span>
          {summary.downloading > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <DownloadIcon className="size-3" />
              {summary.downloading} downloading
            </span>
          )}
          {summary.seeding > 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <UploadIcon className="size-3" />
              {summary.seeding} seeding
            </span>
          )}
          {summary.paused > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <PauseIcon className="size-3" />
              {summary.paused} paused
            </span>
          )}
        </div>
      )}

      {output.message && !summary && (
        <p className="text-xs text-muted-foreground">{output.message}</p>
      )}

      <div className="space-y-2">
        {visibleTorrents.map((item) => (
          <TorrentEntry item={item} key={item.hash} />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          <Button
            className="w-full max-w-xs"
            onClick={handleLoadMore}
            size="sm"
            variant="ghost"
          >
            <ChevronDownIcon className="size-4 mr-1" />
            Load {Math.min(PAGE_SIZE, remaining)} more ({remaining} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Combined queue view that auto-detects arr vs torrent
 */
export function QueueView({
  output,
  state,
}: ToolResultProps<ArrQueueShape | TorrentQueueShape>) {
  if (!output) {
    return (
      <div className="text-sm text-muted-foreground py-2">No queue data.</div>
    );
  }

  if ("items" in output) {
    return <ArrQueueView output={output} state={state} />;
  }

  if ("torrents" in output) {
    return <TorrentQueueView output={output} state={state} />;
  }

  return (
    <div className="text-sm text-muted-foreground py-2">
      Invalid queue data.
    </div>
  );
}
