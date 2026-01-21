import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchSeries } from './search-series';
import { sonarrRequest, SonarrClientError } from './client';
import type { SonarrSeries } from './types';
import type { Session } from 'next-auth';

// Mock the client
vi.mock('./client', () => ({
  sonarrRequest: vi.fn(),
  SonarrClientError: class SonarrClientError extends Error {
    constructor(
      message: string,
      public statusCode?: number
    ) {
      super(message);
      this.name = 'SonarrClientError';
    }
  },
}));

describe('searchSeries', () => {
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
    vi.mocked(sonarrRequest).mockResolvedValue([]);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'nonexistent series' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      results: [],
      message: 'No TV series found matching "nonexistent series".',
    });
    expect(sonarrRequest).toHaveBeenCalledWith(
      'user-123',
      '/series/lookup?term=nonexistent%20series'
    );
  });

  it('maps SonarrSeries to DisplayableMedia correctly', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Breaking Bad',
        sortTitle: 'breaking bad',
        status: 'ended',
        ended: true,
        overview: 'A high school chemistry teacher turned methamphetamine producer.',
        network: 'AMC',
        images: [
          {
            coverType: 'poster',
            url: '/local/poster.jpg',
            remoteUrl: 'https://artworks.thetvdb.com/poster.jpg',
          },
        ],
        remotePoster: 'https://artworks.thetvdb.com/remote-poster.jpg',
        seasons: [
          { seasonNumber: 0, monitored: false },
          { seasonNumber: 1, monitored: true },
          { seasonNumber: 2, monitored: true },
          { seasonNumber: 3, monitored: true },
          { seasonNumber: 4, monitored: true },
          { seasonNumber: 5, monitored: true },
        ],
        year: 2008,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 47,
        tvdbId: 81189,
        seriesType: 'standard',
        cleanTitle: 'breakingbad',
        imdbId: 'tt0903747',
        titleSlug: 'breaking-bad',
        genres: ['Drama', 'Thriller', 'Crime'],
        tags: [],
        ratings: { votes: 5000, value: 9.5 },
        statistics: {
          seasonCount: 5,
          episodeFileCount: 62,
          episodeCount: 62,
          totalEpisodeCount: 63,
          sizeOnDisk: 50000000000,
          percentOfEpisodes: 100,
        },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'breaking bad' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      title: 'Breaking Bad',
      posterUrl: 'https://artworks.thetvdb.com/remote-poster.jpg',
      mediaType: 'tv',
      year: 2008,
      overview: 'A high school chemistry teacher turned methamphetamine producer.',
      rating: 9.5,
      genres: ['Drama', 'Thriller', 'Crime'],
      runtime: 47,
      seasonCount: 5,
      status: 'available',
      monitored: true,
      externalIds: {
        tvdb: 81189,
        imdb: 'tt0903747',
      },
    });
  });

  it('uses image remoteUrl when remotePoster is not available', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Test Series',
        sortTitle: 'test series',
        status: 'continuing',
        ended: false,
        overview: 'Test overview',
        images: [
          {
            coverType: 'poster',
            url: '/local/poster.jpg',
            remoteUrl: 'https://artworks.thetvdb.com/poster-from-images.jpg',
          },
        ],
        seasons: [{ seasonNumber: 1, monitored: true }],
        year: 2023,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 45,
        tvdbId: 12345,
        seriesType: 'standard',
        cleanTitle: 'testseries',
        titleSlug: 'test-series',
        genres: [],
        tags: [],
        ratings: { votes: 100, value: 7.0 },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].posterUrl).toBe(
      'https://artworks.thetvdb.com/poster-from-images.jpg'
    );
  });

  it('truncates long overviews', async () => {
    const longOverview = 'B'.repeat(300);
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Long Overview Series',
        sortTitle: 'long overview series',
        status: 'continuing',
        ended: false,
        overview: longOverview,
        images: [],
        seasons: [{ seasonNumber: 1, monitored: true }],
        year: 2023,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: false,
        useSceneNumbering: false,
        runtime: 30,
        tvdbId: 99999,
        seriesType: 'standard',
        cleanTitle: 'longoverviewseries',
        titleSlug: 'long-overview-series',
        genres: [],
        tags: [],
        ratings: { votes: 50, value: 6.0 },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'long' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].overview).toBe('B'.repeat(200) + '...');
  });

  it('limits results to 10', async () => {
    const mockSeries: SonarrSeries[] = Array(15)
      .fill(null)
      .map((_, i) => ({
        title: `Series ${i + 1}`,
        sortTitle: `series ${i + 1}`,
        status: 'continuing' as const,
        ended: false,
        overview: `Overview ${i + 1}`,
        images: [],
        seasons: [{ seasonNumber: 1, monitored: true }],
        year: 2023,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: false,
        useSceneNumbering: false,
        runtime: 45,
        tvdbId: i + 1,
        seriesType: 'standard' as const,
        cleanTitle: `series${i + 1}`,
        titleSlug: `series-${i + 1}`,
        genres: [],
        tags: [],
        ratings: { votes: 100, value: 7.0 },
      }));

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'series' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results).toHaveLength(10);
    expect(result.message).toBe(
      'Found 15 TV series matching "series". Showing top 10 results.'
    );
  });

  it('handles SonarrClientError', async () => {
    vi.mocked(sonarrRequest).mockRejectedValue(
      new SonarrClientError('Sonarr is not configured. Please configure Sonarr in settings.')
    );

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      error: 'Sonarr is not configured. Please configure Sonarr in settings.',
    });
  });

  it('handles generic errors', async () => {
    vi.mocked(sonarrRequest).mockRejectedValue(new Error('Network error'));

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'test' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result).toEqual({
      error: 'Failed to search for TV series. Please try again.',
    });
  });

  it('derives correct status for monitored series without files', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Wanted Series',
        sortTitle: 'wanted series',
        status: 'continuing',
        ended: false,
        overview: 'A series that is wanted',
        images: [],
        seasons: [{ seasonNumber: 1, monitored: true }],
        year: 2023,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 60,
        tvdbId: 11111,
        seriesType: 'standard',
        cleanTitle: 'wantedseries',
        titleSlug: 'wanted-series',
        genres: [],
        tags: [],
        ratings: { votes: 200, value: 8.0 },
        statistics: {
          seasonCount: 1,
          episodeFileCount: 0,
          episodeCount: 10,
          totalEpisodeCount: 10,
          sizeOnDisk: 0,
          percentOfEpisodes: 0,
        },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'wanted' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].status).toBe('wanted');
  });

  it('counts seasons correctly excluding specials (season 0)', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Season Count Series',
        sortTitle: 'season count series',
        status: 'ended',
        ended: true,
        overview: 'A series for testing season counts',
        images: [],
        seasons: [
          { seasonNumber: 0, monitored: false }, // Specials - should not count
          { seasonNumber: 1, monitored: true },
          { seasonNumber: 2, monitored: true },
          { seasonNumber: 3, monitored: true },
        ],
        year: 2020,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 45,
        tvdbId: 33333,
        seriesType: 'standard',
        cleanTitle: 'seasoncountseries',
        titleSlug: 'season-count-series',
        genres: [],
        tags: [],
        ratings: { votes: 500, value: 8.5 },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'season count' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].seasonCount).toBe(3);
  });

  it('uses statistics.seasonCount when available', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'Statistics Series',
        sortTitle: 'statistics series',
        status: 'ended',
        ended: true,
        overview: 'A series with statistics',
        images: [],
        seasons: [
          { seasonNumber: 0, monitored: false },
          { seasonNumber: 1, monitored: true },
          { seasonNumber: 2, monitored: true },
        ],
        year: 2019,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 50,
        tvdbId: 44444,
        seriesType: 'standard',
        cleanTitle: 'statisticsseries',
        titleSlug: 'statistics-series',
        genres: [],
        tags: [],
        ratings: { votes: 300, value: 7.8 },
        statistics: {
          seasonCount: 2,
          episodeFileCount: 20,
          episodeCount: 20,
          totalEpisodeCount: 22,
          sizeOnDisk: 30000000000,
          percentOfEpisodes: 100,
        },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'statistics' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    // Should use statistics.seasonCount (2) rather than counting seasons array
    expect(result.results[0].seasonCount).toBe(2);
  });

  it('handles series with null poster', async () => {
    const mockSeries: SonarrSeries[] = [
      {
        title: 'No Poster Series',
        sortTitle: 'no poster series',
        status: 'continuing',
        ended: false,
        overview: 'A series without a poster',
        images: [],
        seasons: [{ seasonNumber: 1, monitored: true }],
        year: 2023,
        qualityProfileId: 1,
        seasonFolder: true,
        monitored: true,
        useSceneNumbering: false,
        runtime: 45,
        tvdbId: 55555,
        seriesType: 'standard',
        cleanTitle: 'noposterseries',
        titleSlug: 'no-poster-series',
        genres: [],
        tags: [],
        ratings: { votes: 10, value: 5.0 },
      },
    ];

    vi.mocked(sonarrRequest).mockResolvedValue(mockSeries);

    const tool = searchSeries({ session: mockSession });
    const result = await tool.execute({ query: 'no poster' }, {
      toolCallId: 'test-call-id',
      messages: [],
    });

    expect(result.results[0].posterUrl).toBeNull();
  });
});
