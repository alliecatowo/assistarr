"use client";

import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FilmIcon,
  TvIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EpisodeCalendarItem,
  EpisodeCalendarShape,
  MovieCalendarItem,
  MovieCalendarShape,
  ToolResultProps,
} from "./types";

/** Default max items for calendar displays */
const DEFAULT_MAX_CALENDAR_ITEMS = 25;

/**
 * Group items by date
 */
function groupByDate<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateKey = item.date;
    const existing = groups.get(dateKey) || [];
    existing.push(item);
    groups.set(dateKey, existing);
  }

  return groups;
}

/**
 * Format a date string to a readable format
 */
function formatDate(dateStr: string): {
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
} {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const isToday = dateOnly.getTime() === today.getTime();
  const isTomorrow = dateOnly.getTime() === tomorrow.getTime();
  const isPast = dateOnly.getTime() < today.getTime();

  if (isToday) {
    return { label: "Today", isToday: true, isTomorrow: false, isPast: false };
  }
  if (isTomorrow) {
    return {
      label: "Tomorrow",
      isToday: false,
      isTomorrow: true,
      isPast: false,
    };
  }

  // Format as "Mon, Jan 15"
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return { label: formatted, isToday: false, isTomorrow: false, isPast };
}

/**
 * Get status icon and color
 */
function getStatusStyle(
  status?: string,
  hasFile?: boolean
): { icon: typeof CheckCircleIcon; color: string } {
  if (hasFile) {
    return { icon: CheckCircleIcon, color: "text-green-500" };
  }

  const statusLower = status?.toLowerCase() || "";

  if (statusLower.includes("downloaded") || statusLower.includes("available")) {
    return { icon: CheckCircleIcon, color: "text-green-500" };
  }
  if (statusLower.includes("missing")) {
    return { icon: AlertCircleIcon, color: "text-red-400" };
  }
  if (statusLower.includes("today") || statusLower.includes("tomorrow")) {
    return { icon: ClockIcon, color: "text-yellow-500" };
  }

  return { icon: ClockIcon, color: "text-muted-foreground" };
}

/**
 * Movie calendar item component
 */
function MovieCalendarEntry({ item }: { item: MovieCalendarItem }) {
  const { icon: StatusIcon, color } = getStatusStyle(item.status, item.hasFile);

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FilmIcon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">
              {item.title}
              {item.year && (
                <span className="text-muted-foreground"> ({item.year})</span>
              )}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {item.releaseType && item.releaseType !== "unknown" && (
                <span className="capitalize">{item.releaseType} Release</span>
              )}
              {item.runtime && (
                <>
                  {item.releaseType && item.releaseType !== "unknown" && (
                    <span className="text-border">|</span>
                  )}
                  <span>{item.runtime}min</span>
                </>
              )}
            </div>
          </div>
          <StatusIcon className={cn("size-4 shrink-0 mt-0.5", color)} />
        </div>
        {item.overview && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {item.overview}
          </p>
        )}
        {item.status && (
          <span className="mt-1.5 inline-block text-[10px] text-muted-foreground capitalize">
            {item.status}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Episode calendar item component
 */
function EpisodeCalendarEntry({ item }: { item: EpisodeCalendarItem }) {
  const { icon: StatusIcon, color } = getStatusStyle(item.status, item.hasFile);

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <TvIcon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">
              {item.seriesTitle}
            </h4>
            <p className="text-xs text-muted-foreground">
              S{String(item.seasonNumber).padStart(2, "0")}E
              {String(item.episodeNumber).padStart(2, "0")}
              {item.episodeTitle && ` - ${item.episodeTitle}`}
            </p>
          </div>
          <StatusIcon className={cn("size-4 shrink-0 mt-0.5", color)} />
        </div>
        {item.network && (
          <span className="mt-1 inline-block text-[10px] text-muted-foreground">
            {item.network}
          </span>
        )}
        {item.status && (
          <span className="mt-1 ml-2 inline-block text-[10px] text-muted-foreground capitalize">
            {item.status}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Calendar view for movie releases
 */
export function MovieCalendarView({
  output,
}: ToolResultProps<MovieCalendarShape>) {
  if (!output || !output.movies || output.movies.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No upcoming movies."}
      </div>
    );
  }

  // Apply max limit
  const allMovies = output.movies;
  const movies = allMovies.slice(0, DEFAULT_MAX_CALENDAR_ITEMS);
  const isTruncated = allMovies.length > DEFAULT_MAX_CALENDAR_ITEMS;

  // Transform and group by date
  const itemsWithDate = movies.map((m) => ({
    ...m,
    date: m.releaseDate,
  }));
  const grouped = groupByDate(itemsWithDate);

  // Sort dates
  const sortedDates = Array.from(grouped.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-4">
      {output.message && (
        <p className="text-xs text-muted-foreground">{output.message}</p>
      )}

      {sortedDates.map((dateKey) => {
        const items = grouped.get(dateKey)!;
        const { label, isToday, isTomorrow, isPast } = formatDate(dateKey);

        return (
          <div key={dateKey}>
            <div
              className={cn(
                "flex items-center gap-2 mb-2 pb-1 border-b",
                isToday && "border-primary/50",
                isTomorrow && "border-yellow-500/50",
                isPast && "border-muted"
              )}
            >
              <CalendarIcon
                className={cn(
                  "size-4",
                  isToday
                    ? "text-primary"
                    : isTomorrow
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday
                    ? "text-primary"
                    : isTomorrow
                      ? "text-yellow-500"
                      : isPast
                        ? "text-muted-foreground"
                        : ""
                )}
              >
                {label}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <MovieCalendarEntry
                  item={item}
                  key={`${item.tmdbId || item.title}-${idx}`}
                />
              ))}
            </div>
          </div>
        );
      })}

      {isTruncated && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {movies.length} of {allMovies.length} movies (limited)
        </p>
      )}
    </div>
  );
}

/**
 * Calendar view for TV episodes
 */
export function EpisodeCalendarView({
  output,
}: ToolResultProps<EpisodeCalendarShape>) {
  if (!output || !output.episodes || output.episodes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No upcoming episodes."}
      </div>
    );
  }

  // Apply max limit
  const allEpisodes = output.episodes;
  const episodes = allEpisodes.slice(0, DEFAULT_MAX_CALENDAR_ITEMS);
  const isTruncated = allEpisodes.length > DEFAULT_MAX_CALENDAR_ITEMS;

  // Transform and group by date
  const itemsWithDate = episodes.map((e) => ({
    ...e,
    date: e.airDate,
  }));
  const grouped = groupByDate(itemsWithDate);

  // Sort dates
  const sortedDates = Array.from(grouped.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-4">
      {output.message && (
        <p className="text-xs text-muted-foreground">{output.message}</p>
      )}

      {sortedDates.map((dateKey) => {
        const items = grouped.get(dateKey)!;
        const { label, isToday, isTomorrow, isPast } = formatDate(dateKey);

        return (
          <div key={dateKey}>
            <div
              className={cn(
                "flex items-center gap-2 mb-2 pb-1 border-b",
                isToday && "border-primary/50",
                isTomorrow && "border-yellow-500/50",
                isPast && "border-muted"
              )}
            >
              <CalendarIcon
                className={cn(
                  "size-4",
                  isToday
                    ? "text-primary"
                    : isTomorrow
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday
                    ? "text-primary"
                    : isTomorrow
                      ? "text-yellow-500"
                      : isPast
                        ? "text-muted-foreground"
                        : ""
                )}
              >
                {label}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <EpisodeCalendarEntry
                  item={item}
                  key={`${item.seriesTitle}-${item.seasonNumber}-${item.episodeNumber}-${idx}`}
                />
              ))}
            </div>
          </div>
        );
      })}

      {isTruncated && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {episodes.length} of {allEpisodes.length} episodes (limited)
        </p>
      )}
    </div>
  );
}

/**
 * Combined calendar view that auto-detects movie vs episode
 */
export function CalendarView({
  output,
  state,
}: ToolResultProps<MovieCalendarShape | EpisodeCalendarShape>) {
  if (!output) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No calendar data.
      </div>
    );
  }

  if ("movies" in output) {
    return <MovieCalendarView output={output} state={state} />;
  }

  if ("episodes" in output) {
    return <EpisodeCalendarView output={output} state={state} />;
  }

  return (
    <div className="text-sm text-muted-foreground py-2">
      Invalid calendar data.
    </div>
  );
}
