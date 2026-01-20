"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
  HardDriveIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type TorrentState =
  | "downloading"
  | "uploading"
  | "paused"
  | "queued"
  | "checking"
  | "completed"
  | "stalled"
  | "error";

export interface TorrentCardProps {
  /** Torrent name */
  name: string;
  /** Download progress (0-100) */
  progress: number;
  /** Download speed (formatted, e.g., "5.2 MB/s") */
  downloadSpeed?: string;
  /** Upload speed (formatted, e.g., "1.1 MB/s") */
  uploadSpeed?: string;
  /** Number of seeds */
  seeds?: number;
  /** Number of peers */
  peers?: number;
  /** Total size */
  size?: string;
  /** Downloaded size */
  downloaded?: string;
  /** Uploaded size */
  uploaded?: string;
  /** Estimated time remaining */
  eta?: string;
  /** Current state */
  state: TorrentState;
  /** Category/label */
  category?: string;
  /** Error message if state is error */
  errorMessage?: string;
  /** Callback for pause action */
  onPause?: () => void;
  /** Callback for resume action */
  onResume?: () => void;
  /** Whether actions are disabled */
  actionsDisabled?: boolean;
  /** Additional className */
  className?: string;
}

function getStateConfig(state: TorrentState): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
} {
  const configs: Record<TorrentState, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }> = {
    downloading: {
      label: "Downloading",
      variant: "default",
      icon: <ArrowDownIcon className="size-3 animate-pulse" />,
    },
    uploading: {
      label: "Seeding",
      variant: "secondary",
      icon: <ArrowUpIcon className="size-3" />,
    },
    paused: {
      label: "Paused",
      variant: "outline",
      icon: <PauseIcon className="size-3" />,
    },
    queued: {
      label: "Queued",
      variant: "outline",
      icon: <ClockIcon className="size-3" />,
    },
    checking: {
      label: "Checking",
      variant: "secondary",
      icon: <HardDriveIcon className="size-3 animate-spin" />,
    },
    completed: {
      label: "Completed",
      variant: "default",
      icon: <CheckCircleIcon className="size-3" />,
    },
    stalled: {
      label: "Stalled",
      variant: "secondary",
      icon: <AlertCircleIcon className="size-3" />,
    },
    error: {
      label: "Error",
      variant: "destructive",
      icon: <AlertCircleIcon className="size-3" />,
    },
  };
  return configs[state];
}

export function TorrentCard({
  name,
  progress,
  downloadSpeed,
  uploadSpeed,
  seeds,
  peers,
  size,
  downloaded,
  uploaded,
  eta,
  state,
  category,
  errorMessage,
  onPause,
  onResume,
  actionsDisabled = false,
  className,
}: TorrentCardProps) {
  const stateConfig = getStateConfig(state);
  const isActive = state === "downloading" || state === "uploading";
  const isPaused = state === "paused";
  const showProgress = state !== "completed" || progress < 100;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 font-medium text-sm">{name}</h4>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              )}
              <Badge variant={stateConfig.variant} className="flex items-center gap-1 text-xs">
                {stateConfig.icon}
                {stateConfig.label}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>{progress.toFixed(1)}%</span>
                {downloaded && size && (
                  <span>{downloaded} / {size}</span>
                )}
              </div>
            </div>
          )}

          {/* Speed and peers info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
            {isActive && downloadSpeed && (
              <span className="flex items-center gap-1">
                <ArrowDownIcon className="size-3 text-green-500" />
                {downloadSpeed}
              </span>
            )}
            {isActive && uploadSpeed && (
              <span className="flex items-center gap-1">
                <ArrowUpIcon className="size-3 text-blue-500" />
                {uploadSpeed}
              </span>
            )}
            {(seeds !== undefined || peers !== undefined) && (
              <span className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                {seeds ?? 0} seeds / {peers ?? 0} peers
              </span>
            )}
            {eta && state === "downloading" && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                ETA: {eta}
              </span>
            )}
          </div>

          {/* Upload stats for seeding */}
          {state === "uploading" && uploaded && (
            <div className="text-muted-foreground text-xs">
              Uploaded: {uploaded}
            </div>
          )}

          {/* Error message */}
          {state === "error" && errorMessage && (
            <p className="text-red-500 text-xs">{errorMessage}</p>
          )}

          {/* Action buttons */}
          {(onPause || onResume) && (
            <div className="flex gap-2 pt-1">
              {isActive && onPause && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPause}
                  disabled={actionsDisabled}
                >
                  <PauseIcon className="mr-1 size-4" />
                  Pause
                </Button>
              )}
              {isPaused && onResume && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResume}
                  disabled={actionsDisabled}
                >
                  <PlayIcon className="mr-1 size-4" />
                  Resume
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
