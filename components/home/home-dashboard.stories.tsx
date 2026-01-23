import type { Story, StoryDefault } from "@ladle/react";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import type { DiscoverSection } from "@/components/discover/discover-context";
import { HomeDashboard } from "./home-dashboard";

const mockStatus: MonitorStatus = {
  services: {
    radarr: { configured: true, enabled: true, online: true },
    sonarr: { configured: true, enabled: true, online: true },
    jellyseerr: { configured: true, enabled: true, online: true },
    jellyfin: { configured: true, enabled: true, online: true },
    qbittorrent: { configured: true, enabled: true, online: true },
  },
  queues: {
    radarr: [
      {
        id: 1,
        title: "The Matrix",
        status: "Downloading",
        progress: 45,
        size: 5_000_000_000,
        sizeRemaining: 2_750_000_000,
        timeLeft: "23 minutes",
        source: "Radarr",
      },
      {
        id: 2,
        title: "Inception",
        status: "Queued",
        progress: 0,
        size: 4_800_000_000,
        sizeRemaining: 4_800_000_000,
        source: "Radarr",
      },
    ],
    sonarr: [
      {
        id: 3,
        title: "Breaking Bad",
        subtitle: "S01E01 - Pilot",
        status: "Downloading",
        progress: 78,
        size: 1_200_000_000,
        sizeRemaining: 264_000_000,
        timeLeft: "5 minutes",
        source: "Sonarr",
      },
    ],
  },
  torrents: [
    {
      hash: "abc123",
      name: "Avatar.torrent",
      state: "Downloading",
      progress: 62,
      size: 8_200_000_000,
      dlspeed: 15_000_000,
      upspeed: 500_000,
      eta: 360,
    },
  ],
  requests: { pending: [] },
  errors: { failed: [], stalled: [] },
  stats: { activeStreams: 3, pendingRequests: 2, totalDownloads: 156 },
};

const mockDiscoverSections: DiscoverSection[] = [
  {
    id: "trending",
    title: "Trending Now",
    items: [
      {
        id: 1,
        title: "Dune: Part Two",
        year: 2024,
        mediaType: "movie" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.8,
      },
      {
        id: 2,
        title: "The Batman",
        year: 2022,
        mediaType: "movie" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.1,
      },
      {
        id: 3,
        title: "Oppenheimer",
        year: 2023,
        mediaType: "movie" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.5,
      },
      {
        id: 4,
        title: "Spider-Man: Across the Spider-Verse",
        year: 2023,
        mediaType: "movie" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.6,
      },
    ],
  },
  {
    id: "popular-tv",
    title: "Popular TV",
    items: [
      {
        id: 5,
        title: "House of the Dragon",
        year: 2022,
        mediaType: "tv" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.4,
      },
      {
        id: 6,
        title: "The Last of Us",
        year: 2023,
        mediaType: "tv" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.8,
      },
      {
        id: 7,
        title: "Succession",
        year: 2018,
        mediaType: "tv" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.3,
      },
      {
        id: 8,
        title: "The Crown",
        year: 2016,
        mediaType: "tv" as const,
        status: "available" as const,
        posterUrl: "https://via.placeholder.com/300x450",
        rating: 8.3,
      },
    ],
  },
];

const mockContinueWatching = [
  {
    id: "1",
    title: "Dune: Part Two",
    subtitle: "S01E03",
    progress: 67,
    remaining: "45 min left",
    lastWatched: "2024-01-20",
    badge: "Movie",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "2",
    title: "House of the Dragon",
    subtitle: "S02E05",
    progress: 23,
    remaining: "52 min left",
    lastWatched: "2024-01-19",
    badge: "TV",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "3",
    title: "Breaking Bad",
    subtitle: "S03E07",
    progress: 89,
    remaining: "6 min left",
    lastWatched: "2024-01-18",
    badge: "TV",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "4",
    title: "Oppenheimer",
    progress: 45,
    remaining: "2h 30m left",
    lastWatched: "2024-01-15",
    badge: "Movie",
    imageUrl: "https://via.placeholder.com/240x360",
  },
];

const mockPersonalized = {
  recommendations: [
    {
      id: 101,
      title: "Blade Runner 2049",
      mediaType: "movie" as const,
      status: "available" as const,
      reason: "Similar to Dune: sci-fi epic with stunning visuals",
    },
    {
      id: 102,
      title: "True Detective",
      mediaType: "tv" as const,
      status: "available" as const,
      reason: "Matches your interest in dark, atmospheric storytelling",
    },
    {
      id: 103,
      title: "Arrival",
      mediaType: "movie" as const,
      status: "available" as const,
      reason: "Mind-bending sci-fi like Interstellar",
    },
  ],
  profile: {
    topGenres: [
      { genre: "Sci-Fi", percentage: 35, count: 45 },
      { genre: "Drama", percentage: 25, count: 32 },
      { genre: "Thriller", percentage: 20, count: 26 },
      { genre: "Action", percentage: 15, count: 19 },
      { genre: "Crime", percentage: 5, count: 6 },
    ],
    favoriteDecades: [
      { decade: "2010s", percentage: 45, count: 58 },
      { decade: "2000s", percentage: 30, count: 39 },
      { decade: "1990s", percentage: 20, count: 26 },
    ],
    totalItems: 128,
    totalMovies: 78,
    totalShows: 50,
    totalRuntimeHours: 542,
    totalSizeGB: 2150,
    averageRating: 7.8,
    genreDiversityScore: 72,
  },
};

export default {
  title: "Home / HomeDashboard",
} satisfies StoryDefault;

// Full dashboard with all widgets
export const Default: Story = () => (
  <HomeDashboard
    continueWatching={mockContinueWatching}
    discoverSections={mockDiscoverSections}
    personalized={mockPersonalized}
    status={mockStatus}
    userName="Alex"
  />
);

// Dashboard without services configured
export const NoServices: Story = () => (
  <HomeDashboard
    continueWatching={[]}
    discoverSections={[]}
    personalized={null}
    status={null}
    userName="Guest"
  />
);

// Dashboard with no continue watching
export const NoContinueWatching: Story = () => (
  <HomeDashboard
    continueWatching={[]}
    discoverSections={mockDiscoverSections}
    personalized={mockPersonalized}
    status={mockStatus}
    userName="Alex"
  />
);

// Dashboard with empty queue
export const EmptyQueue: Story = () => {
  const emptyStatus = {
    ...mockStatus,
    queues: { radarr: [], sonarr: [] },
    torrents: [],
  };
  return (
    <HomeDashboard
      continueWatching={mockContinueWatching}
      discoverSections={mockDiscoverSections}
      personalized={mockPersonalized}
      status={emptyStatus}
      userName="Alex"
    />
  );
};

// Dashboard with errors
export const WithErrors: Story = () => {
  const errorStatus = {
    ...mockStatus,
    services: {
      radarr: {
        configured: true,
        enabled: true,
        online: false,
        error: "Connection timeout",
      },
      sonarr: { configured: true, enabled: true, online: true },
      jellyseerr: { configured: true, enabled: true, online: true },
      jellyfin: { configured: true, enabled: true, online: true },
      qbittorrent: { configured: false, enabled: false, online: false },
    },
  };
  return (
    <HomeDashboard
      continueWatching={mockContinueWatching}
      discoverSections={mockDiscoverSections}
      personalized={mockPersonalized}
      status={errorStatus}
      userName="Alex"
    />
  );
};

// Dashboard without user name
export const Anonymous: Story = () => (
  <HomeDashboard
    continueWatching={mockContinueWatching}
    discoverSections={mockDiscoverSections}
    personalized={null}
    status={mockStatus}
  />
);

// Dashboard with heavy downloads
export const HeavyDownloads: Story = () => {
  const heavyStatus = {
    ...mockStatus,
    queues: {
      radarr: [
        {
          id: 1,
          title: "The Matrix",
          status: "Downloading",
          progress: 45,
          size: 5_000_000_000,
          sizeRemaining: 2_750_000_000,
          timeLeft: "23 minutes",
          source: "Radarr",
        },
        {
          id: 2,
          title: "Inception",
          status: "Downloading",
          progress: 12,
          size: 4_800_000_000,
          sizeRemaining: 4_224_000_000,
          timeLeft: "2 hours",
          source: "Radarr",
        },
        {
          id: 3,
          title: "Interstellar",
          status: "Queued",
          progress: 0,
          size: 8_200_000_000,
          sizeRemaining: 8_200_000_000,
          source: "Radarr",
        },
        {
          id: 4,
          title: "Tenet",
          status: "Queued",
          progress: 0,
          size: 7_200_000_000,
          sizeRemaining: 7_200_000_000,
          source: "Radarr",
        },
      ],
      sonarr: [
        {
          id: 5,
          title: "Breaking Bad",
          subtitle: "S01E01",
          status: "Downloading",
          progress: 78,
          size: 1_200_000_000,
          sizeRemaining: 264_000_000,
          timeLeft: "5 minutes",
          source: "Sonarr",
        },
        {
          id: 6,
          title: "Better Call Saul",
          subtitle: "S06E01",
          status: "Downloading",
          progress: 34,
          size: 2_100_000_000,
          sizeRemaining: 1_386_000_000,
          timeLeft: "45 minutes",
          source: "Sonarr",
        },
      ],
    },
    torrents: [
      {
        hash: "abc123",
        name: "Avatar.torrent",
        state: "Downloading",
        progress: 62,
        size: 8_200_000_000,
        dlspeed: 15_000_000,
        upspeed: 500_000,
        eta: 360,
      },
      {
        hash: "def456",
        name: "Endgame.torrent",
        state: "Downloading",
        progress: 28,
        size: 10_240_000_000,
        dlspeed: 22_000_000,
        upspeed: 300_000,
        eta: 600,
      },
    ],
    stats: { activeStreams: 8, pendingRequests: 5, totalDownloads: 342 },
  };
  return (
    <HomeDashboard
      continueWatching={mockContinueWatching}
      discoverSections={mockDiscoverSections}
      personalized={mockPersonalized}
      status={heavyStatus}
      userName="Alex"
    />
  );
};
