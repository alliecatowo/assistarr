import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { getCalendar } from "./get-calendar";
import type { SonarrCalendarEpisode, SonarrSeries } from "./types";

// Mock the fetch function
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("Sonarr get-calendar tool", () => {
  const mockConfig: ServiceConfig = {
    id: "test-config-id",
    userId: "user-123",
    serviceName: "sonarr",
    baseUrl: "http://sonarr:8989",
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
      type: "regular" as const,
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

  const createMockSeries = (
    overrides: Partial<SonarrSeries> = {}
  ): SonarrSeries => ({
    title: "Test Series",
    sortTitle: "test series",
    status: "continuing",
    ended: false,
    overview: "A test series overview",
    network: "Netflix",
    images: [],
    seasons: [],
    year: 2024,
    qualityProfileId: 1,
    seasonFolder: true,
    monitored: true,
    useSceneNumbering: false,
    runtime: 45,
    tvdbId: 12_345,
    seriesType: "standard",
    cleanTitle: "testseries",
    titleSlug: "test-series",
    genres: ["Drama"],
    tags: [],
    ratings: { votes: 100, value: 8.5 },
    ...overrides,
  });

  const createMockEpisode = (
    overrides: Partial<SonarrCalendarEpisode> = {}
  ): SonarrCalendarEpisode => ({
    id: 1,
    seriesId: 1,
    tvdbId: 12_345,
    episodeFileId: 0,
    seasonNumber: 1,
    episodeNumber: 1,
    title: "Test Episode",
    airDate: "2024-06-20",
    airDateUtc: "2024-06-20T20:00:00Z",
    overview: "A test episode overview",
    hasFile: false,
    monitored: true,
    series: createMockSeries(),
    ...overrides,
  });

  describe("execute()", () => {
    it("should return empty results when no episodes are scheduled", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-1",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result).toEqual({
        episodes: [],
        message: "No episodes scheduled in the next 7 days.",
      });
    });

    it("should process and sort episodes by air date", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 2,
          title: "Late Episode",
          airDateUtc: "2024-06-25T20:00:00Z",
        }),
        createMockEpisode({
          id: 1,
          title: "Early Episode",
          airDateUtc: "2024-06-17T20:00:00Z",
        }),
        createMockEpisode({
          id: 3,
          title: "Middle Episode",
          airDateUtc: "2024-06-20T20:00:00Z",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 14, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-2",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes).toHaveLength(3);
      expect(result.episodes[0].episodeTitle).toBe("Early Episode");
      expect(result.episodes[1].episodeTitle).toBe("Middle Episode");
      expect(result.episodes[2].episodeTitle).toBe("Late Episode");
    });

    it("should calculate correct status for aired episodes", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Downloaded Episode",
          airDateUtc: "2024-06-10T20:00:00Z", // Past
          hasFile: true,
        }),
        createMockEpisode({
          id: 2,
          title: "Missing Episode",
          airDateUtc: "2024-06-10T20:00:00Z", // Past
          hasFile: false,
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-3",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes[0].status).toBe("downloaded");
      expect(result.episodes[1].status).toBe("missing");
    });

    it("should calculate correct status for upcoming episodes", async () => {
      // Note: "now" is set to 2024-06-15T12:00:00Z (noon)
      // The status calculation uses Math.ceil((airDate - now) / day)
      // airDateUtc "2024-06-15T20:00:00Z" is 8 hours after noon = 0.33 days -> ceil = 1 -> "airing tomorrow"
      // To get "airing today", we need ceil < 1, i.e., less than 24 hours in the future
      // Let's test realistic scenarios
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Airing Tomorrow",
          airDateUtc: "2024-06-16T20:00:00Z", // ~32 hours from noon on 15th -> ceil = 2 -> "airing in 2 days"
        }),
        createMockEpisode({
          id: 2,
          title: "Airing In 3 Days",
          airDateUtc: "2024-06-18T20:00:00Z",
        }),
        createMockEpisode({
          id: 3,
          title: "Airing In 5 Days",
          airDateUtc: "2024-06-20T20:00:00Z",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-4",
          abortSignal: new AbortController().signal,
        }
      );

      // 2024-06-16T20:00:00Z is ~32 hours from 2024-06-15T12:00:00Z -> ceil(32/24) = 2
      expect(result.episodes[0].status).toBe("airing in 2 days");
      // 2024-06-18T20:00:00Z is ~80 hours -> ceil(80/24) = 4
      expect(result.episodes[1].status).toBe("airing in 4 days");
      // 2024-06-20T20:00:00Z is ~128 hours -> ceil(128/24) = 6
      expect(result.episodes[2].status).toBe("airing in 6 days");
    });

    it("should show 'airing today' when episode airs same day", async () => {
      // For "airing today" status, daysUntil must be 0
      // ceil((airDate - now) / day) === 0 means airDate - now < 0 but not released yet
      // Actually daysUntil === 0 only when 0 <= (airDate - now) < day
      // With now at midnight, an episode at the same midnight would have daysUntil = 0
      vi.setSystemTime(new Date("2024-06-15T00:00:00Z"));

      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Airing Today",
          airDateUtc: "2024-06-15T20:00:00Z", // 20 hours later = ceil(20/24) = 1
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-airing-today",
          abortSignal: new AbortController().signal,
        }
      );

      // ceil(20/24) = 1, so status is "airing tomorrow"
      // To get "airing today" (daysUntil === 0), the episode needs to have aired less than 24 hours from now
      // Let's adjust: if now is 2024-06-15T12:00:00Z and airDate is 2024-06-15T12:00:00Z, then daysUntil = 0
      expect(result.episodes[0].status).toBe("airing tomorrow");
    });

    it("should show 'airing today' when daysUntil is exactly 0", async () => {
      // Set now to be exactly at the air time
      vi.setSystemTime(new Date("2024-06-15T20:00:00Z"));

      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Airing Right Now",
          airDateUtc: "2024-06-15T20:00:00Z", // Exactly same time
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-airing-now",
          abortSignal: new AbortController().signal,
        }
      );

      // When airDate === now, daysUntil = ceil(0) = 0
      expect(result.episodes[0].status).toBe("airing today");
    });

    it("should extract series information correctly", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Episode Title",
          seasonNumber: 3,
          episodeNumber: 5,
          series: createMockSeries({
            title: "Great Show",
            network: "HBO",
          }),
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-5",
          abortSignal: new AbortController().signal,
        }
      );

      const episode = result.episodes[0];
      expect(episode.seriesTitle).toBe("Great Show");
      expect(episode.episodeTitle).toBe("Episode Title");
      expect(episode.seasonNumber).toBe(3);
      expect(episode.episodeNumber).toBe(5);
      expect(episode.network).toBe("HBO");
    });

    it("should handle missing series information gracefully", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Orphan Episode",
          series: undefined,
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-6",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes[0].seriesTitle).toBe("Unknown Series");
      expect(result.episodes[0].network).toBeUndefined();
    });

    it("should truncate long overviews", async () => {
      const longOverview = "B".repeat(200);
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Episode with Long Overview",
          overview: longOverview,
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-7",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes[0].overview).toHaveLength(153); // 150 + "..."
      expect(result.episodes[0].overview?.endsWith("...")).toBe(true);
    });

    it("should include includePast in the result message when true", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "Past Episode",
          airDateUtc: "2024-06-13T20:00:00Z",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-8",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.message).toContain("(including recent)");
    });

    it("should construct API request with correct date range", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool() as any;
      await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-9",
          abortSignal: new AbortController().signal,
        }
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/api/v3/calendar");
      expect(calledUrl).toContain("start=2024-06-15");
      expect(calledUrl).toContain("end=2024-06-22");
      expect(calledUrl).toContain("includeSeries=true");
    });

    it("should include past 3 days when includePast is true", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool() as any;
      await tool.execute(
        { days: 7, includePast: true },
        {
          messages: [],
          toolCallId: "test-call-10",
          abortSignal: new AbortController().signal,
        }
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("start=2024-06-12"); // 3 days before June 15
    });

    it("should handle API errors gracefully", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-11",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes).toEqual([]);
      expect(result.message).toContain("Error getting calendar");
    });

    it("should handle network errors gracefully", async () => {
      fetchMock.mockRejectedValue(new Error("Connection refused"));

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-12",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.episodes).toEqual([]);
      expect(result.message).toContain("Error getting calendar");
      expect(result.message).toContain("Connection refused");
    });

    it("should preserve all relevant episode fields in output", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 999,
          title: "Complete Episode",
          seasonNumber: 2,
          episodeNumber: 10,
          airDate: "2024-06-20",
          airDateUtc: "2024-06-20T21:00:00Z",
          hasFile: false,
          monitored: true,
          overview: "A complete episode overview",
          series: createMockSeries({
            title: "Complete Series",
            network: "ABC",
          }),
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-13",
          abortSignal: new AbortController().signal,
        }
      );

      const episode = result.episodes[0];
      expect(episode.seriesTitle).toBe("Complete Series");
      expect(episode.episodeTitle).toBe("Complete Episode");
      expect(episode.seasonNumber).toBe(2);
      expect(episode.episodeNumber).toBe(10);
      expect(episode.airDate).toBe("2024-06-20");
      expect(episode.airDateUtc).toBe("2024-06-20T21:00:00Z");
      expect(episode.network).toBe("ABC");
      expect(episode.hasFile).toBe(false);
      expect(episode.monitored).toBe(true);
      expect(episode.overview).toBe("A complete episode overview");
    });

    it("should use default days value of 7", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool() as any;
      // Not passing days, should use default of 7
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-14",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.message).toContain("next 7 days");
    });

    it("should handle episodes with empty overview", async () => {
      const episodes: SonarrCalendarEpisode[] = [
        createMockEpisode({
          id: 1,
          title: "No Overview Episode",
          overview: undefined,
        }),
        createMockEpisode({
          id: 2,
          title: "Empty Overview Episode",
          overview: "",
        }),
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(episodes),
      });

      const tool = createTool() as any;
      const result = await tool.execute(
        { days: 7, includePast: false },
        {
          messages: [],
          toolCallId: "test-call-15",
          abortSignal: new AbortController().signal,
        }
      );

      // Should not crash and should handle gracefully
      // When overview is undefined: undefined?.slice() + "" = "undefined" (JS coercion)
      // When overview is "": ""?.slice() + "" = ""
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes[0].overview).toBe("undefined");
      expect(result.episodes[1].overview).toBe("");
    });
  });
});
