"use client";

import * as React from "react";
import { TvIcon, DownloadIcon, CalendarIcon, FilmIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MediaCard, type MediaCardProps } from "./media-card";

export type SeriesDownloadStatus =
  | "continuing"
  | "ended"
  | "upcoming"
  | "downloaded"
  | "partial"
  | "missing";

export interface SeriesCardProps extends Omit<MediaCardProps, "badges" | "actions" | "children"> {
  /** Total number of seasons */
  seasonCount?: number;
  /** Total number of episodes */
  episodeCount?: number;
  /** Number of downloaded episodes */
  downloadedEpisodes?: number;
  /** Network or streaming service */
  network?: string;
  /** Series status */
  status?: SeriesDownloadStatus;
  /** Quality profile name */
  quality?: string;
  /** Next airing date */
  nextAiring?: string;
  /** Additional actions */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

function getStatusBadge(status: SeriesDownloadStatus) {
  const config: Record<SeriesDownloadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    continuing: { label: "Continuing", variant: "default" },
    ended: { label: "Ended", variant: "secondary" },
    upcoming: { label: "Upcoming", variant: "outline" },
    downloaded: { label: "Downloaded", variant: "default" },
    partial: { label: "Partial", variant: "secondary" },
    missing: { label: "Missing", variant: "destructive" },
  };

  const { label, variant } = config[status];
  return (
    <Badge variant={variant} className="text-xs">
      {status === "continuing" || status === "ended" || status === "upcoming" ? (
        <TvIcon className="mr-1 size-3" />
      ) : (
        <DownloadIcon className="mr-1 size-3" />
      )}
      {label}
    </Badge>
  );
}

export function SeriesCard({
  title,
  year,
  rating,
  overview,
  posterUrl,
  posterAlt,
  genres,
  seasonCount,
  episodeCount,
  downloadedEpisodes,
  network,
  status,
  quality,
  nextAiring,
  actions,
  className,
}: SeriesCardProps) {
  const badges = status && getStatusBadge(status);

  // Calculate download progress text
  const progressText = React.useMemo(() => {
    if (downloadedEpisodes !== undefined && episodeCount !== undefined && episodeCount > 0) {
      const percentage = Math.round((downloadedEpisodes / episodeCount) * 100);
      return `${downloadedEpisodes}/${episodeCount} episodes (${percentage}%)`;
    }
    return null;
  }, [downloadedEpisodes, episodeCount]);

  return (
    <MediaCard
      title={title}
      year={year}
      rating={rating}
      overview={overview}
      posterUrl={posterUrl}
      posterAlt={posterAlt}
      genres={genres}
      badges={badges}
      actions={actions}
      className={cn("", className)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
          {seasonCount !== undefined && (
            <span className="flex items-center gap-1">
              <FilmIcon className="size-3.5" />
              {seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}
            </span>
          )}
          {episodeCount !== undefined && (
            <span className="flex items-center gap-1">
              <TvIcon className="size-3.5" />
              {episodeCount} Episodes
            </span>
          )}
          {network && (
            <Badge variant="outline" className="text-xs">
              {network}
            </Badge>
          )}
        </div>

        {(progressText || quality || nextAiring) && (
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            {progressText && (
              <span className="flex items-center gap-1">
                <DownloadIcon className="size-3.5" />
                {progressText}
              </span>
            )}
            {quality && (
              <Badge variant="outline" className="text-xs">
                {quality}
              </Badge>
            )}
            {nextAiring && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                Next: {nextAiring}
              </span>
            )}
          </div>
        )}
      </div>
    </MediaCard>
  );
}
