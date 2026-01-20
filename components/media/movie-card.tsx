"use client";

import * as React from "react";
import { ClockIcon, DownloadIcon, PlusCircleIcon, CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediaCard, type MediaCardProps } from "./media-card";

export type MovieDownloadStatus =
  | "downloaded"
  | "downloading"
  | "queued"
  | "missing"
  | "unavailable";

export type MovieRequestStatus =
  | "available"
  | "pending"
  | "approved"
  | "declined"
  | "requested";

export interface MovieCardProps extends Omit<MediaCardProps, "badges" | "actions" | "children"> {
  /** Runtime in minutes */
  runtime?: number;
  /** Download status from Radarr */
  downloadStatus?: MovieDownloadStatus;
  /** Request status from Jellyseerr */
  requestStatus?: MovieRequestStatus;
  /** Whether the request button should be shown */
  showRequestButton?: boolean;
  /** Callback when request button is clicked */
  onRequest?: () => void;
  /** Whether request is loading */
  isRequesting?: boolean;
  /** Quality profile name */
  quality?: string;
  /** Additional className */
  className?: string;
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getDownloadStatusBadge(status: MovieDownloadStatus) {
  const config: Record<MovieDownloadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    downloaded: { label: "Downloaded", variant: "default" },
    downloading: { label: "Downloading", variant: "secondary" },
    queued: { label: "Queued", variant: "secondary" },
    missing: { label: "Missing", variant: "destructive" },
    unavailable: { label: "Unavailable", variant: "outline" },
  };

  const { label, variant } = config[status];
  return (
    <Badge variant={variant} className="text-xs">
      <DownloadIcon className="mr-1 size-3" />
      {label}
    </Badge>
  );
}

function getRequestStatusBadge(status: MovieRequestStatus) {
  const config: Record<MovieRequestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    available: { label: "Available", variant: "default" },
    pending: { label: "Pending", variant: "secondary" },
    approved: { label: "Approved", variant: "secondary" },
    declined: { label: "Declined", variant: "destructive" },
    requested: { label: "Requested", variant: "outline" },
  };

  const { label, variant } = config[status];
  return (
    <Badge variant={variant} className="text-xs">
      {status === "available" ? (
        <CheckCircleIcon className="mr-1 size-3" />
      ) : (
        <ClockIcon className="mr-1 size-3" />
      )}
      {label}
    </Badge>
  );
}

export function MovieCard({
  title,
  year,
  rating,
  overview,
  posterUrl,
  posterAlt,
  genres,
  runtime,
  downloadStatus,
  requestStatus,
  showRequestButton = false,
  onRequest,
  isRequesting = false,
  quality,
  className,
}: MovieCardProps) {
  const badges = (
    <>
      {downloadStatus && getDownloadStatusBadge(downloadStatus)}
      {requestStatus && getRequestStatusBadge(requestStatus)}
    </>
  );

  const actions = showRequestButton && onRequest && (
    <Button
      size="sm"
      variant="outline"
      onClick={onRequest}
      disabled={isRequesting || requestStatus === "pending" || requestStatus === "approved"}
    >
      <PlusCircleIcon className="mr-1 size-4" />
      {isRequesting ? "Requesting..." : "Request"}
    </Button>
  );

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
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
        {runtime && runtime > 0 && (
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {formatRuntime(runtime)}
          </span>
        )}
        {quality && (
          <Badge variant="outline" className="text-xs">
            {quality}
          </Badge>
        )}
      </div>
    </MediaCard>
  );
}
