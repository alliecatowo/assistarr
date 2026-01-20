import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrCalendarMovie } from "./types";

type GetCalendarProps = {
  session: Session;
};

export const getCalendar = ({ session }: GetCalendarProps) =>
  tool({
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

        const movies = await radarrRequest<RadarrCalendarMovie[]>(
          session.user.id,
          `/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
        );

        if (movies.length === 0) {
          return {
            movies: [],
            message: `No movies scheduled in the next ${days} days.`,
          };
        }

        const calendarItems = movies.map((movie) => {
          // Determine the most relevant release date
          const releaseDate =
            movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas;
          const releaseDateObj = releaseDate ? new Date(releaseDate) : null;
          const isReleased = releaseDateObj ? releaseDateObj < now : false;
          const daysUntil = releaseDateObj
            ? Math.ceil(
                (releaseDateObj.getTime() - now.getTime()) /
                  (24 * 60 * 60 * 1000)
              )
            : null;

          // Determine release type
          let releaseType = "unknown";
          if (movie.digitalRelease && movie.digitalRelease === releaseDate) {
            releaseType = "digital";
          } else if (
            movie.physicalRelease &&
            movie.physicalRelease === releaseDate
          ) {
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
            status: isReleased
              ? movie.hasFile
                ? "downloaded"
                : "missing"
              : daysUntil === 0
                ? "releasing today"
                : daysUntil === 1
                  ? "releasing tomorrow"
                  : daysUntil !== null
                    ? `releasing in ${daysUntil} days`
                    : "release date unknown",
            runtime: movie.runtime,
            genres: movie.genres,
          };
        });

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
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get calendar. Please try again." };
      }
    },
  });
