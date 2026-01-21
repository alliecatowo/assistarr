"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  PauseIcon,
  UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArrQueueShape, TorrentQueueShape } from "../types";

interface StatusPreviewProps {
  output: ArrQueueShape | TorrentQueueShape;
  className?: string;
}

/**
 * Status summary for queue results.
 * Shows counts of items in different states (downloading, seeding, etc.)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: View logic is complex
export function StatusPreview({ output, className }: StatusPreviewProps) {
  // Handle torrent queue with summary
  if ("torrents" in output && output.summary) {
    const { summary } = output;
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {summary.downloading > 0 && (
          <span className="flex items-center gap-1 text-blue-400">
            <DownloadIcon className="size-3" />
            {summary.downloading}
          </span>
        )}
        {summary.seeding > 0 && (
          <span className="flex items-center gap-1 text-green-400">
            <UploadIcon className="size-3" />
            {summary.seeding}
          </span>
        )}
        {summary.paused > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <PauseIcon className="size-3" />
            {summary.paused}
          </span>
        )}
        {summary.downloading === 0 &&
          summary.seeding === 0 &&
          summary.paused === 0 && (
            <span className="text-muted-foreground">Empty queue</span>
          )}
      </div>
    );
  }

  // Handle arr queue (Radarr/Sonarr)
  if ("items" in output) {
    const items = output.items;
    if (items.length === 0) {
      return (
        <span className={cn("text-xs text-muted-foreground", className)}>
          Empty queue
        </span>
      );
    }

    // Count statuses
    const statusCounts: Record<string, number> = {};
    let errorCount = 0;
    let completedCount = 0;

    for (const item of items) {
      const status = item.status.toLowerCase();

      if (item.errorMessage || status.includes("error")) {
        errorCount++;
      } else if (
        status.includes("complet") ||
        status.includes("done") ||
        status === "completed"
      ) {
        completedCount++;
      } else {
        // Group by simplified status
        let key = "downloading";
        if (status.includes("queue") || status.includes("wait")) {
          key = "queued";
        } else if (status.includes("pause") || status.includes("stall")) {
          key = "stalled";
        } else if (status.includes("import")) {
          key = "importing";
        }
        statusCounts[key] = (statusCounts[key] || 0) + 1;
      }
    }

    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {statusCounts.downloading > 0 && (
          <span className="flex items-center gap-1 text-blue-400">
            <DownloadIcon className="size-3" />
            {statusCounts.downloading}
          </span>
        )}
        {statusCounts.queued > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <PauseIcon className="size-3" />
            {statusCounts.queued} queued
          </span>
        )}
        {statusCounts.stalled > 0 && (
          <span className="flex items-center gap-1 text-orange-400">
            <AlertCircleIcon className="size-3" />
            {statusCounts.stalled} stalled
          </span>
        )}
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircleIcon className="size-3" />
            {completedCount} done
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircleIcon className="size-3" />
            {errorCount} errors
          </span>
        )}
      </div>
    );
  }

  return null;
}
