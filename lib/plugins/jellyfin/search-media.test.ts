import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { ToolError } from "../core/errors";
import { searchMedia } from "./search-media";
import type { ItemsResponse, MediaItem } from "./types";

// Mock the fetch function
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("Jellyfin search-media tool", () => {
  const mockConfig: ServiceConfig = {
    id: "test-config-id",
    userId: "user-123",
    serviceName: "jellyfin",
    baseUrl: "http://jellyfin:8096",
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

  const mockUserId = "jellyfin-user-abc123";

  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createTool = () =>
    searchMedia({ session: mockSession, config: mockConfig });

  const createMockMediaItem = (
    overrides: Partial<MediaItem> = {}
  ): MediaItem => ({
    Id: "item-123",
    Name: "Test Movie",
    Type: "Movie",
    ProductionYear: 2024,
    Overview: "A test movie overview",
    RunTimeTicks: 72_000_000_000, // 2 hours in ticks
    CommunityRating: 8.5,
    Genres: ["Action", "Adventure"],
    ImageTags: { Primary: "abc123" },
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: false,
      Played: false,
    },
    ...overrides,
  });

  const setupUserIdMock = () => {
    // First call for /Users/Me
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ Id: mockUserId }),
    });
  };

  const setupUserIdFallbackMock = () => {
    // First call for /Users/Me fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });
    // Fallback to /Users
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ Id: mockUserId }]),
    });
  };

  describe("execute()", () => {
    it("should return empty results when no items match", async () => {
      setupUserIdMock();

      const response: ItemsResponse = {
        Items: [],
        TotalRecordCount: 0,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "nonexistent", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-1",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.message).toContain('Found 0 result(s) for "nonexistent"');
    });

    it("should search and transform movie results correctly", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "movie-1",
          Name: "Inception",
          Type: "Movie",
          ProductionYear: 2010,
          Overview: "A mind-bending thriller about dream invasion",
          CommunityRating: 8.8,
          Genres: ["Sci-Fi", "Thriller", "Action"],
          RunTimeTicks: 88_800_000_000, // ~2.5 hours
          ImageTags: { Primary: "inception-tag" },
          UserData: {
            PlaybackPositionTicks: 0,
            PlayCount: 2,
            IsFavorite: true,
            Played: true,
          },
        }),
      ];

      const response: ItemsResponse = {
        Items: items,
        TotalRecordCount: 1,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "inception", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-2",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results).toHaveLength(1);
      const movie = result.results[0];
      expect(movie.id).toBe("movie-1");
      expect(movie.title).toBe("Inception");
      expect(movie.type).toBe("Movie");
      expect(movie.year).toBe(2010);
      expect(movie.rating).toBe(8.8);
      expect(movie.genres).toEqual(["Sci-Fi", "Thriller", "Action"]);
      expect(movie.duration).toBe("2h 28m");
      expect(movie.isWatched).toBe(true);
      expect(movie.isFavorite).toBe(true);
      // getImageUrl uses the imageTag value as the path parameter
      expect(movie.imageUrl).toContain(
        "http://jellyfin:8096/Items/movie-1/Images/inception-tag"
      );
    });

    it("should search and transform series results correctly", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "series-1",
          Name: "Breaking Bad",
          Type: "Series",
          ProductionYear: 2008,
          Overview:
            "A high school chemistry teacher turned methamphetamine manufacturer",
          CommunityRating: 9.5,
          Genres: ["Drama", "Crime"],
          RunTimeTicks: 27_000_000_000, // ~45 min per episode
          ImageTags: { Primary: "bb-tag" },
        }),
      ];

      const response: ItemsResponse = {
        Items: items,
        TotalRecordCount: 1,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "breaking", limit: 10, mediaType: "shows" },
        {
          messages: [],
          toolCallId: "test-call-3",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe("Series");
      expect(result.results[0].title).toBe("Breaking Bad");
    });

    it("should filter by movies only when mediaType is movies", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "movies" },
        {
          messages: [],
          toolCallId: "test-call-4",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      const searchUrl = fetchMock.mock.calls[1][0] as string;
      expect(searchUrl).toContain("IncludeItemTypes=Movie");
      expect(searchUrl).not.toContain("Series");
    });

    it("should filter by shows only when mediaType is shows", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "shows" },
        {
          messages: [],
          toolCallId: "test-call-5",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      const searchUrl = fetchMock.mock.calls[1][0] as string;
      expect(searchUrl).toContain("IncludeItemTypes=Series");
      expect(searchUrl).not.toContain("Movie");
    });

    it("should include both movies and series when mediaType is all", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-6",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      const searchUrl = fetchMock.mock.calls[1][0] as string;
      expect(searchUrl).toContain("IncludeItemTypes=Movie%2CSeries");
    });

    it("should respect the limit parameter", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      (await tool.execute?.(
        { query: "test", limit: 5, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-7",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      const searchUrl = fetchMock.mock.calls[1][0] as string;
      expect(searchUrl).toContain("Limit=5");
    });

    it("should truncate long overviews to 200 characters", async () => {
      setupUserIdMock();

      const longOverview = "A".repeat(300);
      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "long-overview",
          Overview: longOverview,
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 1 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-8",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results[0].overview).toHaveLength(200);
    });

    it("should limit genres to 3", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "many-genres",
          Genres: ["Action", "Adventure", "Comedy", "Drama", "Horror"],
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 1 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-9",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results[0].genres).toHaveLength(3);
      expect(result.results[0].genres).toEqual([
        "Action",
        "Adventure",
        "Comedy",
      ]);
    });

    it("should handle items without RunTimeTicks", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "no-duration",
          RunTimeTicks: undefined,
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 1 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-10",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results[0].duration).toBeNull();
    });

    it("should handle items without ImageTags", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "no-image",
          ImageTags: undefined,
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 1 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-11",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      // Should still generate an image URL
      expect(result.results[0].imageUrl).toContain(
        "http://jellyfin:8096/Items/no-image/Images/Primary"
      );
    });

    it("should handle items without UserData", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "no-userdata",
          UserData: undefined,
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 1 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-12",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results[0].isWatched).toBe(false);
      expect(result.results[0].isFavorite).toBe(false);
    });

    it("should fallback to /Users endpoint when /Users/Me fails", async () => {
      setupUserIdFallbackMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-13",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      // Should have called /Users/Me, then /Users, then the search
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.results).toEqual([]);
    });

    it("should throw ToolError on API errors", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const tool = createTool();
      await expect(
        tool.execute?.(
          { query: "test", limit: 10, mediaType: "all" },
          {
            messages: [],
            toolCallId: "test-call-14",
            abortSignal: new AbortController().signal,
          }
        )
      ).rejects.toThrow(ToolError);
    });

    it("should throw ToolError on network errors", async () => {
      fetchMock.mockRejectedValue(new Error("Connection failed"));

      const tool = createTool();
      await expect(
        tool.execute?.(
          { query: "test", limit: 10, mediaType: "all" },
          {
            messages: [],
            toolCallId: "test-call-15",
            abortSignal: new AbortController().signal,
          }
        )
      ).rejects.toThrow(ToolError);

      try {
        await tool.execute?.(
          { query: "test", limit: 10, mediaType: "all" },
          {
            messages: [],
            toolCallId: "test-call-15b",
            abortSignal: new AbortController().signal,
          }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        expect((error as ToolError).message).toContain("Connection failed");
        expect((error as ToolError).toolName).toBe("searchMedia");
      }
    });

    it("should throw ToolError when no users are found", async () => {
      // /Users/Me fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });
      // /Users returns empty array
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      const tool = createTool();
      await expect(
        tool.execute?.(
          { query: "test", limit: 10, mediaType: "all" },
          {
            messages: [],
            toolCallId: "test-call-16",
            abortSignal: new AbortController().signal,
          }
        )
      ).rejects.toThrow(ToolError);

      // Verify error contains useful context
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([]),
      });

      try {
        await tool.execute?.(
          { query: "test", limit: 10, mediaType: "all" },
          {
            messages: [],
            toolCallId: "test-call-16b",
            abortSignal: new AbortController().signal,
          }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        expect((error as ToolError).message).toContain("No users found");
      }
    });

    it("should construct correct search URL with all parameters", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      (await tool.execute?.(
        { query: "Matrix", limit: 15, mediaType: "movies" },
        {
          messages: [],
          toolCallId: "test-call-17",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      const searchUrl = fetchMock.mock.calls[1][0] as string;
      expect(searchUrl).toContain(`/Users/${mockUserId}/Items`);
      expect(searchUrl).toContain("SearchTerm=Matrix");
      expect(searchUrl).toContain("Recursive=true");
      expect(searchUrl).toContain("Limit=15");
      expect(searchUrl).toContain(
        "Fields=Overview%2CGenres%2CCommunityRating%2CProductionYear"
      );
      expect(searchUrl).toContain("EnableImages=true");
    });

    it("should include query in result", async () => {
      setupUserIdMock();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: [], TotalRecordCount: 0 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "Avatar", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-18",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.query).toBe("Avatar");
    });

    it("should format duration correctly for various lengths", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({
          Id: "short",
          Name: "Short Video",
          RunTimeTicks: 18_000_000_000, // 30 minutes
        }),
        createMockMediaItem({
          Id: "long",
          Name: "Long Movie",
          RunTimeTicks: 108_000_000_000, // 3 hours
        }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Items: items, TotalRecordCount: 2 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "test", limit: 10, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-19",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results[0].duration).toBe("30m");
      expect(result.results[1].duration).toBe("3h 0m");
    });

    it("should return totalResults from API response", async () => {
      setupUserIdMock();

      const items: MediaItem[] = [
        createMockMediaItem({ Id: "1" }),
        createMockMediaItem({ Id: "2" }),
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ Items: items, TotalRecordCount: 150 }),
      });

      const tool = createTool();
      const result = (await tool.execute?.(
        { query: "popular", limit: 2, mediaType: "all" },
        {
          messages: [],
          toolCallId: "test-call-20",
          abortSignal: new AbortController().signal,
        }
      )) as any;

      expect(result.results).toHaveLength(2);
      expect(result.totalResults).toBe(150);
    });
  });
});
