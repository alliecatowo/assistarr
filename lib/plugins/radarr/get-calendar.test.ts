import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { getCalendar } from "./get-calendar";
import type { RadarrCalendarMovie } from "./types";

// Mock the fetch function
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("Radarr get-calendar tool", () => {
  const mockConfig: ServiceConfig = {
    id: "test-config-id",
    userId: "user-123",
    serviceName: "radarr",
    baseUrl: "http://radarr:7878",
    apiKey: "test-api-key",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession: Session = {
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      type: "regular",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.useFakeTimers();
    // Set a fixed "now" for predictable date calculations
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createTool = () =>
    getCalendar({ session: mockSession, config: mockConfig }) as any;

  const createMockMovie = (
    overrides: Partial<RadarrCalendarMovie> = {}
  ): RadarrCalendarMovie => ({
    title: "Test Movie",
    sortTitle: "test movie",
    sizeOnDisk: 0,
    status: "announced",
    overview: "A test movie overview",
    images: [],
    year: 2024,
    hasFile: false,
    qualityProfileId: 1,
    monitored: true,
    minimumAvailability: "announced",
    isAvailable: false,
    runtime: 120,
    cleanTitle: "testmovie",
    tmdbId: 12_345,
    titleSlug: "test-movie-12345",
    genres: ["Action", "Drama"],
    tags: [],
    ratings: {},
    ...overrides,
  });

  describe("execute()", () => {
    it("should return empty results when no movies are scheduled", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-1",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result).toEqual({
        movies: [],
        message: "No movies scheduled in the next 30 days.",
      });
    });

    it("should process and sort movies by release date", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Late Movie",
          tmdbId: 2,
          digitalRelease: "2024-07-01",
        }),
        createMockMovie({
          title: "Early Movie",
          tmdbId: 1,
          digitalRelease: "2024-06-20",
        }),
        createMockMovie({
          title: "Middle Movie",
          tmdbId: 3,
          digitalRelease: "2024-06-25",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-2",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies).toHaveLength(3);
      expect(result.movies[0].title).toBe("Early Movie");
      expect(result.movies[1].title).toBe("Middle Movie");
      expect(result.movies[2].title).toBe("Late Movie");
    });

    it("should calculate correct release type based on available dates", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Digital Release",
          tmdbId: 1,
          digitalRelease: "2024-06-20",
          physicalRelease: "2024-07-01",
          inCinemas: "2024-05-01",
        }),
        createMockMovie({
          title: "Cinema Release",
          tmdbId: 2,
          inCinemas: "2024-06-25",
        }),
        createMockMovie({
          title: "Physical Release",
          tmdbId: 3,
          physicalRelease: "2024-06-28",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-3",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies[0].releaseType).toBe("digital");
      expect(result.movies[1].releaseType).toBe("cinema");
      expect(result.movies[2].releaseType).toBe("physical");
    });

    it("should handle movies with no release date as unknown", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Unknown Release",
          tmdbId: 1,
        }),
        createMockMovie({
          title: "Known Release",
          tmdbId: 2,
          digitalRelease: "2024-06-20",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-4",
          abortSignal: new AbortController().signal,
        }
      );

      // Known release should come first, unknown last
      expect(result.movies[0].title).toBe("Known Release");
      expect(result.movies[1].title).toBe("Unknown Release");
      expect(result.movies[1].releaseDate).toBe("Unknown");
      expect(result.movies[1].releaseType).toBe("unknown");
    });

    it("should calculate correct status for released movies", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Downloaded Movie",
          tmdbId: 1,
          digitalRelease: "2024-06-10", // Past
          hasFile: true,
        }),
        createMockMovie({
          title: "Missing Movie",
          tmdbId: 2,
          digitalRelease: "2024-06-10", // Past
          hasFile: false,
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-5",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies[0].status).toBe("downloaded");
      expect(result.movies[1].status).toBe("missing");
    });

    it("should calculate correct status for upcoming movies", async () => {
      // Note: "now" is set to 2024-06-15T12:00:00Z
      // A release date of "2024-06-15" (midnight) is BEFORE noon, so it's considered released
      // We need to use dates that are clearly in the future based on full timestamp comparison
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Releasing Tomorrow",
          tmdbId: 1,
          digitalRelease: "2024-06-16", // 1 day after "now"
        }),
        createMockMovie({
          title: "Releasing In 2 Days",
          tmdbId: 2,
          digitalRelease: "2024-06-17", // 2 days after
        }),
        createMockMovie({
          title: "Releasing In 5 Days",
          tmdbId: 3,
          digitalRelease: "2024-06-20", // 5 days after
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-6",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies[0].status).toBe("releasing tomorrow");
      expect(result.movies[1].status).toBe("releasing in 2 days");
      expect(result.movies[2].status).toBe("releasing in 5 days");
    });

    it("should show 'releasing today' when daysUntil is 0", async () => {
      // For "releasing today" to show, we need Math.ceil((releaseDate - now) / day) === 0
      // This happens when release is on the same day but slightly in the future
      // Since dates are compared at midnight, and "now" is noon,
      // a release date of "2024-06-15T18:00:00" would be same day but after noon
      // However, the API returns dates as date strings like "2024-06-15", which parse to midnight
      // So a daysUntil of 0 would require the release to be within the same 24-hour window
      // Let's test by setting now to early morning so midnight of same day is "today"
      vi.setSystemTime(new Date("2024-06-15T00:00:00Z")); // Midnight, same as release date

      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Releasing Today",
          tmdbId: 1,
          digitalRelease: "2024-06-15", // Same date, same midnight
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-releasing-today",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies[0].status).toBe("releasing today");
    });

    it("should truncate long overviews", async () => {
      const longOverview = "A".repeat(200);
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Movie with Long Overview",
          tmdbId: 1,
          digitalRelease: "2024-06-20",
          overview: longOverview,
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-7",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies[0].overview).toHaveLength(153); // 150 + "..."
      expect(result.movies[0].overview?.endsWith("...")).toBe(true);
    });

    it("should include includePast in the result message when true", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Test Movie",
          tmdbId: 1,
          digitalRelease: "2024-06-10",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-8",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.message).toContain("(including recent releases)");
    });

    it("should construct API request with correct date range", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool();
      await tool.execute(
        { days: 14, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-9",
          abortSignal: new AbortController().signal,
        }
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/api/v3/calendar");
      expect(calledUrl).toContain("start=2024-06-15");
      expect(calledUrl).toContain("end=2024-06-29");
    });

    it("should include past 7 days when includePast is true", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool();
      await tool.execute(
        { days: 14, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-10",
          abortSignal: new AbortController().signal,
        }
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("start=2024-06-08"); // 7 days before June 15
    });

    it("should handle API errors gracefully", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-11",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies).toEqual([]);
      expect(result.message).toContain("Error getting calendar");
    });

    it("should handle network errors gracefully", async () => {
      fetchMock.mockRejectedValue(new Error("Network timeout"));

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-12",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.movies).toEqual([]);
      expect(result.message).toContain("Error getting calendar");
      expect(result.message).toContain("Network timeout");
    });

    it("should preserve all relevant movie fields in output", async () => {
      const movies: RadarrCalendarMovie[] = [
        createMockMovie({
          title: "Complete Movie",
          tmdbId: 99_999,
          year: 2024,
          digitalRelease: "2024-06-20",
          physicalRelease: "2024-07-01",
          inCinemas: "2024-05-01",
          hasFile: false,
          monitored: true,
          overview: "A complete movie overview",
          runtime: 142,
          genres: ["Sci-Fi", "Thriller"],
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(movies),
      });

      const tool = createTool();
      const result = await tool.execute(
        { days: 30, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-13",
          abortSignal: new AbortController().signal,
        }
      );

      const movie = result.movies[0];
      expect(movie.title).toBe("Complete Movie");
      expect(movie.tmdbId).toBe(99_999);
      expect(movie.year).toBe(2024);
      expect(movie.releaseDate).toBe("2024-06-20");
      expect(movie.releaseType).toBe("digital");
      expect(movie.inCinemas).toBe("2024-05-01");
      expect(movie.digitalRelease).toBe("2024-06-20");
      expect(movie.physicalRelease).toBe("2024-07-01");
      expect(movie.hasFile).toBe(false);
      expect(movie.monitored).toBe(true);
      expect(movie.overview).toBe("A complete movie overview");
      expect(movie.runtime).toBe(142);
      expect(movie.genres).toEqual(["Sci-Fi", "Thriller"]);
    });
  });
});
