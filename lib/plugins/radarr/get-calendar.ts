import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrCalendarMovie } from "./types";

export const getCalendar = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get upcoming movies from Radarr. Shows movies that are releasing soon (in cinemas, digitally, or physically) within the specified number of days.",
    inputSchema: z.object({
      days: z
        .number()
        .optional()
        .default(30)
        .describe("Number of days to look ahead (default: 30)"),
      includePast: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Include movies that released in the past few days (default: false)"
        ),
    }),
    execute: async ({ days, includePast }) => {
      try {
        const now = new Date();
        const start = includePast
          ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          : now;
        const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const movies = await client.get<RadarrCalendarMovie[]>("/calendar", {
          start: start.toISOString(),
          end: end.toISOString(),
        });

        if (movies.length === 0) {
          return {
            movies: [],
            message: `No movies scheduled in the next ${days} days.`,
          };
        }

        const calendarItems = movies.map((movie) => processMovie(movie, now));

        // Sort by release date
        calendarItems.sort((a, b) => {
          if (a.releaseDate === "Unknown") {
            return 1;
          }
          if (b.releaseDate === "Unknown") {
            return -1;
          }
          return (
            new Date(a.releaseDate).getTime() -
            new Date(b.releaseDate).getTime()
          );
        });

        return {
          movies: calendarItems,
          message: `Found ${movies.length} movie(s) scheduled${includePast ? " (including recent releases)" : ""}.`,
        };
      } catch (error) {
        return {
          movies: [],
          message: `Error getting calendar: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function processMovie(movie: RadarrCalendarMovie, now: Date) {
  // Determine the most relevant release date
  const releaseDate =
    movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas;
  const releaseDateObj = releaseDate ? new Date(releaseDate) : null;
  const isReleased = releaseDateObj ? releaseDateObj < now : false;
  const daysUntil = releaseDateObj
    ? Math.ceil(
        (releaseDateObj.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
    : null;

  // Determine release type
  let releaseType = "unknown";
  if (movie.digitalRelease && movie.digitalRelease === releaseDate) {
    releaseType = "digital";
  } else if (movie.physicalRelease && movie.physicalRelease === releaseDate) {
    releaseType = "physical";
  } else if (movie.inCinemas && movie.inCinemas === releaseDate) {
    releaseType = "cinema";
  }

  return {
    title: movie.title,
    year: movie.year,
    tmdbId: movie.tmdbId,
    releaseDate: releaseDate ?? "Unknown",
    releaseType,
    inCinemas: movie.inCinemas,
    digitalRelease: movie.digitalRelease,
    physicalRelease: movie.physicalRelease,
    hasFile: movie.hasFile,
    monitored: movie.monitored,
    overview:
      movie.overview?.slice(0, 150) +
      (movie.overview && movie.overview.length > 150 ? "..." : ""),
    status: getStatusDescription(isReleased, movie.hasFile, daysUntil),
    runtime: movie.runtime,
    genres: movie.genres,
  };
}

function getStatusDescription(
  isReleased: boolean,
  hasFile: boolean,
  daysUntil: number | null
) {
  if (isReleased) {
    return hasFile ? "downloaded" : "missing";
  }
  if (daysUntil === 0) {
    return "releasing today";
  }
  if (daysUntil === 1) {
    return "releasing tomorrow";
  }
  if (daysUntil !== null) {
    return `releasing in ${daysUntil} days`;
  }
  return "release date unknown";
}
