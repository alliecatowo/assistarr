import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchMovies } from './search-movies';
import { radarrRequest, RadarrClientError } from './client';
import type { RadarrMovie } from './types';
import type { Session } from 'next-auth';

// Mock the client
vi.mock('./client', () => ({
  radarrRequest: vi.fn(),
  RadarrClientError: class RadarrClientError extends Error {
    constructor(
      message: string,
      public statusCode?: number
    ) {
      super(message);
      this.name = 'RadarrClientError';
    }
  },
}));

describe('searchMovies', () => {
  const mockSession: Session = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
    expires: '2030-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty results for no matches', async () => {
    vi.mocked(radarrRequest).mockResolvedValue([]);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'nonexistent movie' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      results: [],
      message: 'No movies found matching "nonexistent movie".',
    });
    expect(radarrRequest).toHaveBeenCalledWith(
      'user-123',
      '/movie/lookup?term=nonexistent%20movie'
    );
  });

  it('maps RadarrMovie to DisplayableMedia correctly', async () => {
    const mockMovies: RadarrMovie[] = [
      {
        title: 'Inception',
        originalTitle: 'Inception',
        sortTitle: 'inception',
        sizeOnDisk: 0,
        status: 'released',
        overview: 'A thief who steals corporate secrets through dream-sharing technology.',
        images: [
          {
            coverType: 'poster',
            url: '/local/poster.jpg',
            remoteUrl: 'https://image.tmdb.org/poster.jpg',
          },
        ],
        remotePoster: 'https://image.tmdb.org/remote-poster.jpg',
        year: 2010,
        hasFile: true,
        qualityProfileId: 1,
        monitored: true,
        minimumAvailability: 'released',
        isAvailable: true,
        runtime: 148,
        cleanTitle: 'inception',
        tmdbId: 27205,
        imdbId: 'tt1375666',
        titleSlug: 'inception-27205',
        genres: ['Action', 'Science Fiction', 'Adventure'],
        tags: [],
        ratings: {
          tmdb: { votes: 32000, value: 8.4, type: 'user' },
          imdb: { votes: 2200000, value: 8.8, type: 'user' },
        },
      },
    ];

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'inception' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      title: 'Inception',
      posterUrl: 'https://image.tmdb.org/remote-poster.jpg',
      mediaType: 'movie',
      year: 2010,
      overview: 'A thief who steals corporate secrets through dream-sharing technology.',
      rating: 8.4,
      genres: ['Action', 'Science Fiction', 'Adventure'],
      runtime: 148,
      status: 'available',
      hasFile: true,
      monitored: true,
      externalIds: {
        tmdb: 27205,
        imdb: 'tt1375666',
      },
    });
  });

  it('uses image remoteUrl when remotePoster is not available', async () => {
    const mockMovies: RadarrMovie[] = [
      {
        title: 'Test Movie',
        sortTitle: 'test movie',
        sizeOnDisk: 0,
        status: 'released',
        overview: 'Test overview',
        images: [
          {
            coverType: 'poster',
            url: '/local/poster.jpg',
            remoteUrl: 'https://image.tmdb.org/poster-from-images.jpg',
          },
        ],
        year: 2023,
        hasFile: false,
        qualityProfileId: 1,
        monitored: true,
        minimumAvailability: 'released',
        isAvailable: false,
        runtime: 120,
        cleanTitle: 'testmovie',
        tmdbId: 12345,
        titleSlug: 'test-movie-12345',
        genres: [],
        tags: [],
        ratings: {},
      },
    ];

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].posterUrl).toBe(
      'https://image.tmdb.org/poster-from-images.jpg'
    );
  });

  it('truncates long overviews', async () => {
    const longOverview = 'A'.repeat(300);
    const mockMovies: RadarrMovie[] = [
      {
        title: 'Long Overview Movie',
        sortTitle: 'long overview movie',
        sizeOnDisk: 0,
        status: 'released',
        overview: longOverview,
        images: [],
        year: 2023,
        hasFile: false,
        qualityProfileId: 1,
        monitored: false,
        minimumAvailability: 'released',
        isAvailable: false,
        runtime: 90,
        cleanTitle: 'longoverviewmovie',
        tmdbId: 99999,
        titleSlug: 'long-overview-99999',
        genres: [],
        tags: [],
        ratings: {},
      },
    ];

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'long' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].overview).toBe('A'.repeat(200) + '...');
  });

  it('limits results to 10', async () => {
    const mockMovies: RadarrMovie[] = Array(15)
      .fill(null)
      .map((_, i) => ({
        title: `Movie ${i + 1}`,
        sortTitle: `movie ${i + 1}`,
        sizeOnDisk: 0,
        status: 'released' as const,
        overview: `Overview ${i + 1}`,
        images: [],
        year: 2023,
        hasFile: false,
        qualityProfileId: 1,
        monitored: false,
        minimumAvailability: 'released' as const,
        isAvailable: false,
        runtime: 90,
        cleanTitle: `movie${i + 1}`,
        tmdbId: i + 1,
        titleSlug: `movie-${i + 1}`,
        genres: [],
        tags: [],
        ratings: {},
      }));

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'movie' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results).toHaveLength(10);
    expect(result.message).toBe(
      'Found 15 movies matching "movie". Showing top 10 results.'
    );
  });

  it('handles RadarrClientError', async () => {
    vi.mocked(radarrRequest).mockRejectedValue(
      new RadarrClientError('Radarr is not configured. Please configure Radarr in settings.')
    );

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      error: 'Radarr is not configured. Please configure Radarr in settings.',
    });
  });

  it('handles generic errors', async () => {
    vi.mocked(radarrRequest).mockRejectedValue(new Error('Network error'));

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      error: 'Failed to search for movies. Please try again.',
    });
  });

  it('derives correct status for monitored movies without files', async () => {
    const mockMovies: RadarrMovie[] = [
      {
        title: 'Wanted Movie',
        sortTitle: 'wanted movie',
        sizeOnDisk: 0,
        status: 'released',
        overview: 'A movie that is wanted',
        images: [],
        year: 2023,
        hasFile: false,
        qualityProfileId: 1,
        monitored: true,
        minimumAvailability: 'released',
        isAvailable: false,
        runtime: 120,
        cleanTitle: 'wantedmovie',
        tmdbId: 11111,
        titleSlug: 'wanted-movie-11111',
        genres: [],
        tags: [],
        ratings: {},
      },
    ];

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'wanted' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].status).toBe('wanted');
  });

  it('uses IMDB rating when TMDB rating is not available', async () => {
    const mockMovies: RadarrMovie[] = [
      {
        title: 'IMDB Only Movie',
        sortTitle: 'imdb only movie',
        sizeOnDisk: 0,
        status: 'released',
        overview: 'A movie with only IMDB rating',
        images: [],
        year: 2023,
        hasFile: false,
        qualityProfileId: 1,
        monitored: false,
        minimumAvailability: 'released',
        isAvailable: false,
        runtime: 100,
        cleanTitle: 'imdbonlymovie',
        tmdbId: 22222,
        titleSlug: 'imdb-only-22222',
        genres: [],
        tags: [],
        ratings: {
          imdb: { votes: 10000, value: 7.5, type: 'user' },
        },
      },
    ];

    vi.mocked(radarrRequest).mockResolvedValue(mockMovies);

    const tool = searchMovies({ session: mockSession });
    const result = await tool.execute({ query: 'imdb' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].rating).toBe(7.5);
  });
});
