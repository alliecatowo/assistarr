"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  HardDriveIcon,
  PauseCircleIcon,
} from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type QueueItemStatus =
  | "downloading"
  | "paused"
  | "queued"
  | "completed"
  | "failed"
  | "warning";

export interface QueueItemProps {
  /** Title of the media item */
  title: string;
  /** Episode or movie info (e.g., "S01E05 - Episode Title") */
  subtitle?: string;
  /** Download progress (0-100) */
  progress?: number;
  /** Current size downloaded */
  sizeDownloaded?: string;
  /** Total size */
  sizeTotal?: string;
  /** Estimated time remaining */
  eta?: string;
  /** Current status */
  status: QueueItemStatus;
  /** Quality profile */
  quality?: string;
  /** Download client name */
  client?: string;
  /** Error or warning message */
  message?: string;
  /** Additional className */
  className?: string;
}

function getStatusIcon(status: QueueItemStatus) {
  const icons: Record<QueueItemStatus, React.ReactNode> = {
    downloading: (
      <DownloadIcon className="size-4 animate-pulse text-blue-500" />
    ),
    paused: <PauseCircleIcon className="size-4 text-yellow-500" />,
    queued: <ClockIcon className="size-4 text-muted-foreground" />,
    completed: <CheckCircleIcon className="size-4 text-green-500" />,
    failed: <AlertCircleIcon className="size-4 text-red-500" />,
    warning: <AlertCircleIcon className="size-4 text-yellow-500" />,
  };
  return icons[status];
}

function getStatusBadge(status: QueueItemStatus) {
  const config: Record<
    QueueItemStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    downloading: { label: "Downloading", variant: "default" },
    paused: { label: "Paused", variant: "secondary" },
    queued: { label: "Queued", variant: "outline" },
    completed: { label: "Completed", variant: "default" },
    failed: { label: "Failed", variant: "destructive" },
    warning: { label: "Warning", variant: "secondary" },
  };

  const { label, variant } = config[status];
  return (
    <Badge className="text-xs" variant={variant}>
      {label}
    </Badge>
  );
}

export function QueueItem({
  title,
  subtitle,
  progress = 0,
  sizeDownloaded,
  sizeTotal,
  eta,
  status,
  quality,
  client,
  message,
  className,
}: QueueItemProps) {
  const showProgress = status === "downloading" || status === "paused";

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {getStatusIcon(status)}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-sm">{title}</h4>
                {subtitle && (
                  <p className="truncate text-muted-foreground text-xs">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {quality && (
                <Badge className="text-xs" variant="outline">
                  {quality}
                </Badge>
              )}
              {getStatusBadge(status)}
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="space-y-1">
              <Progress className="h-2" value={progress} />
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>{progress.toFixed(1)}%</span>
                {sizeDownloaded && sizeTotal && (
                  <span className="flex items-center gap-1">
                    <HardDriveIcon className="size-3" />
                    {sizeDownloaded} / {sizeTotal}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Info row */}
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
            {eta && status === "downloading" && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                ETA: {eta}
              </span>
            )}
            {client && (
              <span className="flex items-center gap-1">
                <DownloadIcon className="size-3" />
                {client}
              </span>
            )}
          </div>

          {/* Error/Warning message */}
          {message && (status === "failed" || status === "warning") && (
            <p
              className={cn(
                "text-xs",
                status === "failed" ? "text-red-500" : "text-yellow-500"
              )}
            >
              {message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
