"use client";

import { CalendarIcon, FilmIcon, TvIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EpisodeCalendarShape, MovieCalendarShape } from "../types";

interface SummaryPreviewProps {
  output: MovieCalendarShape | EpisodeCalendarShape | unknown;
  className?: string;
}

/**
 * Generate summary text for calendar data.
 */
function getCalendarSummary(
  output: MovieCalendarShape | EpisodeCalendarShape
): { text: string; icon: typeof FilmIcon } {
  if ("movies" in output) {
    const count = output.movies.length;
    const today = new Date().toISOString().split("T")[0];
    const upcomingCount = output.movies.filter(
      (m) => m.releaseDate >= today
    ).length;

    if (upcomingCount > 0) {
      return {
        text: `${upcomingCount} upcoming`,
        icon: FilmIcon,
      };
    }
    return {
      text: `${count} movie${count === 1 ? "" : "s"}`,
      icon: FilmIcon,
    };
  }

  if ("episodes" in output) {
    const count = output.episodes.length;
    const today = new Date().toISOString().split("T")[0];
    const upcomingCount = output.episodes.filter(
      (e) => e.airDate >= today
    ).length;

    // Count unique series
    const seriesSet = new Set(output.episodes.map((e) => e.seriesTitle));
    const seriesCount = seriesSet.size;

    if (upcomingCount > 0) {
      return {
        text: `${upcomingCount} episodes from ${seriesCount} show${seriesCount === 1 ? "" : "s"}`,
        icon: TvIcon,
      };
    }
    return {
      text: `${count} episode${count === 1 ? "" : "s"}`,
      icon: TvIcon,
    };
  }

  return { text: "Calendar", icon: CalendarIcon };
}

/**
 * Summary preview for calendar and generic results.
 * Shows a brief text summary with an icon.
 */
export function SummaryPreview({ output, className }: SummaryPreviewProps) {
  // Handle calendar outputs
  if (
    output &&
    typeof output === "object" &&
    ("movies" in output || "episodes" in output)
  ) {
    const { text, icon: Icon } = getCalendarSummary(
      output as MovieCalendarShape | EpisodeCalendarShape
    );

    return (
      <div className={cn("flex items-center gap-1.5 text-xs", className)}>
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-muted-foreground">{text}</span>
      </div>
    );
  }

  // Generic summary (just show that there's data)
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      Results available
    </span>
  );
}
