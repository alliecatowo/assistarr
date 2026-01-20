/**
 * Mock data for E2E tests
 * Contains sample responses from various services for testing
 */

// Service configuration mock data
export const mockServiceConfigs = {
  radarr: {
    serviceName: "radarr",
    baseUrl: "http://localhost:7878",
    apiKey: "test-radarr-api-key",
    isEnabled: true,
  },
  sonarr: {
    serviceName: "sonarr",
    baseUrl: "http://localhost:8989",
    apiKey: "test-sonarr-api-key",
    isEnabled: true,
  },
  jellyfin: {
    serviceName: "jellyfin",
    baseUrl: "http://localhost:8096",
    apiKey: "test-jellyfin-api-key",
    isEnabled: true,
  },
  jellyseerr: {
    serviceName: "jellyseerr",
    baseUrl: "http://localhost:5055",
    apiKey: "test-jellyseerr-api-key",
    isEnabled: true,
  },
  qbittorrent: {
    serviceName: "qbittorrent",
    baseUrl: "http://localhost:8080",
    apiKey: "admin:adminadmin",
    isEnabled: true,
  },
} as const;

// Radarr mock data
export const mockRadarrMovies = [
  {
    title: "Inception",
    year: 2010,
    overview:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    tmdbId: 27205,
    imdbId: "tt1375666",
    status: "released",
    studio: "Warner Bros. Pictures",
    genres: ["Action", "Science Fiction", "Adventure"],
    runtime: 148,
    certification: "PG-13",
    ratings: {
      imdb: { value: 8.8 },
      tmdb: { value: 8.4 },
    },
    remotePoster: "https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
    images: [
      {
        coverType: "poster",
        remoteUrl: "https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
      },
    ],
  },
  {
    title: "The Matrix",
    year: 1999,
    overview:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    tmdbId: 603,
    imdbId: "tt0133093",
    status: "released",
    studio: "Warner Bros. Pictures",
    genres: ["Action", "Science Fiction"],
    runtime: 136,
    certification: "R",
    ratings: {
      imdb: { value: 8.7 },
      tmdb: { value: 8.2 },
    },
    remotePoster: "https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    images: [
      {
        coverType: "poster",
        remoteUrl: "https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      },
    ],
  },
];

export const mockRadarrQueue = {
  page: 1,
  pageSize: 20,
  sortKey: "timeleft",
  sortDirection: "ascending",
  totalRecords: 2,
  records: [
    {
      id: 1,
      movieId: 1,
      movie: {
        title: "Dune: Part Two",
        year: 2024,
      },
      quality: {
        quality: {
          id: 7,
          name: "Bluray-1080p",
          source: "bluray",
          resolution: 1080,
        },
      },
      size: 8589934592,
      sizeleft: 2147483648,
      status: "downloading",
      timeleft: "00:45:00",
      downloadClient: "qBittorrent",
      protocol: "torrent",
      errorMessage: null,
    },
    {
      id: 2,
      movieId: 2,
      movie: {
        title: "Oppenheimer",
        year: 2023,
      },
      quality: {
        quality: {
          id: 7,
          name: "Bluray-1080p",
          source: "bluray",
          resolution: 1080,
        },
      },
      size: 10737418240,
      sizeleft: 10737418240,
      status: "queued",
      timeleft: "02:30:00",
      downloadClient: "qBittorrent",
      protocol: "torrent",
      errorMessage: null,
    },
  ],
};

export const mockRadarrCalendar = [
  {
    title: "Avatar 3",
    releaseDate: "2025-12-19",
    physicalRelease: "2026-03-15",
    year: 2025,
    status: "announced",
  },
  {
    title: "The Batman 2",
    releaseDate: "2026-10-02",
    physicalRelease: null,
    year: 2026,
    status: "announced",
  },
];

// Sonarr mock data
export const mockSonarrSeries = [
  {
    title: "Breaking Bad",
    year: 2008,
    overview:
      "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    tvdbId: 81189,
    imdbId: "tt0903747",
    status: "ended",
    network: "AMC",
    genres: ["Crime", "Drama", "Thriller"],
    runtime: 47,
    certification: "TV-MA",
    ratings: {
      value: 9.5,
    },
    remotePoster: "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
    images: [
      {
        coverType: "poster",
        remoteUrl: "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
      },
    ],
  },
];

export const mockSonarrQueue = {
  page: 1,
  pageSize: 20,
  totalRecords: 1,
  records: [
    {
      id: 1,
      seriesId: 1,
      series: {
        title: "The Last of Us",
        year: 2023,
      },
      episode: {
        title: "When You're Lost in the Darkness",
        seasonNumber: 1,
        episodeNumber: 1,
      },
      quality: {
        quality: {
          id: 7,
          name: "WEBDL-1080p",
        },
      },
      size: 3221225472,
      sizeleft: 1073741824,
      status: "downloading",
      timeleft: "00:15:00",
      downloadClient: "qBittorrent",
      protocol: "torrent",
      errorMessage: null,
    },
  ],
};

export const mockSonarrCalendar = [
  {
    seriesTitle: "House of the Dragon",
    episodeTitle: "The Red Dragon and the Gold",
    seasonNumber: 2,
    episodeNumber: 4,
    airDateUtc: "2024-07-07T01:00:00Z",
  },
];

// Jellyfin mock data
export const mockJellyfinMedia = [
  {
    Id: "abc123",
    Name: "Inception",
    Type: "Movie",
    ProductionYear: 2010,
    Overview: "A thief who steals corporate secrets through dream-sharing technology.",
    RunTimeTicks: 88800000000,
    CommunityRating: 8.8,
    OfficialRating: "PG-13",
  },
  {
    Id: "def456",
    Name: "The Matrix",
    Type: "Movie",
    ProductionYear: 1999,
    Overview: "A computer hacker learns about the true nature of reality.",
    RunTimeTicks: 81600000000,
    CommunityRating: 8.7,
    OfficialRating: "R",
  },
];

export const mockJellyfinContinueWatching = [
  {
    Id: "abc123",
    Name: "Inception",
    Type: "Movie",
    UserData: {
      PlaybackPositionTicks: 44400000000,
      PlayedPercentage: 50,
    },
  },
];

export const mockJellyfinRecentlyAdded = [
  {
    Id: "ghi789",
    Name: "Dune: Part Two",
    Type: "Movie",
    ProductionYear: 2024,
    DateCreated: "2024-05-15T10:00:00Z",
  },
];

// Jellyseerr mock data
export const mockJellyseerrSearch = {
  page: 1,
  totalPages: 1,
  totalResults: 2,
  results: [
    {
      id: 27205,
      mediaType: "movie",
      title: "Inception",
      releaseDate: "2010-07-16",
      overview: "A thief who steals corporate secrets...",
      posterPath: "/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
    },
    {
      id: 603,
      mediaType: "movie",
      title: "The Matrix",
      releaseDate: "1999-03-31",
      overview: "A computer hacker learns...",
      posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    },
  ],
};

export const mockJellyseerrRequests = [
  {
    id: 1,
    status: 2, // approved
    media: {
      tmdbId: 27205,
      mediaType: "movie",
    },
    requestedBy: {
      displayName: "Test User",
    },
    createdAt: "2024-01-15T10:00:00Z",
  },
];

// qBittorrent mock data
export const mockQBittorrentTorrents = [
  {
    hash: "abc123def456",
    name: "Dune.Part.Two.2024.1080p.BluRay.x264",
    size: 8589934592,
    progress: 0.75,
    dlspeed: 10485760,
    upspeed: 1048576,
    eta: 2700,
    state: "downloading",
    category: "radarr",
    save_path: "/downloads/movies/",
    added_on: 1704067200,
    completion_on: 0,
    ratio: 0.5,
  },
  {
    hash: "xyz789abc012",
    name: "The.Last.of.Us.S01E01.1080p.AMZN.WEB-DL",
    size: 3221225472,
    progress: 0.33,
    dlspeed: 5242880,
    upspeed: 524288,
    eta: 5400,
    state: "downloading",
    category: "sonarr",
    save_path: "/downloads/tv/",
    added_on: 1704153600,
    completion_on: 0,
    ratio: 0.2,
  },
];

export const mockQBittorrentTransferInfo = {
  dl_info_speed: 15728640,
  dl_info_data: 107374182400,
  up_info_speed: 1572864,
  up_info_data: 21474836480,
  dl_rate_limit: 0,
  up_rate_limit: 0,
  dht_nodes: 456,
  connection_status: "connected",
};

// Test user credentials
export const testUser = {
  email: "e2e-test@assistarr.test",
  password: "TestPassword123!",
};

// Chat prompts for testing service integrations
export const testPrompts = {
  radarr: {
    searchMovie: "Search for the movie Inception",
    getQueue: "Show my movie download queue",
    getCalendar: "What movies are coming soon?",
    addMovie: "Add Dune Part Two to my library",
  },
  sonarr: {
    searchSeries: "Search for Breaking Bad TV series",
    getQueue: "Show my TV show download queue",
    getCalendar: "What TV episodes are airing this week?",
    addSeries: "Add The Last of Us to my library",
  },
  jellyfin: {
    searchMedia: "Search for Inception in my library",
    continueWatching: "What was I watching?",
    recentlyAdded: "Show recently added movies",
  },
  jellyseerr: {
    searchContent: "Search for movies to request",
    getRequests: "Show my media requests",
    requestMedia: "Request the movie Dune",
  },
  qbittorrent: {
    getTorrents: "Show my active downloads",
    getTransferInfo: "What are my current download speeds?",
  },
};

// Error responses for testing error handling
export const mockErrorResponses = {
  serviceUnavailable: {
    status: 503,
    body: { error: "Service temporarily unavailable" },
  },
  unauthorized: {
    status: 401,
    body: { error: "Invalid API key" },
  },
  notFound: {
    status: 404,
    body: { error: "Resource not found" },
  },
  rateLimit: {
    status: 429,
    body: { error: "Too many requests" },
  },
};
