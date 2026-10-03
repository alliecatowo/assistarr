/**
 * In-process fake Servarr stack for the public demo.
 *
 * Answers the Radarr/Sonarr/qBittorrent/Jellyfin/Jellyseerr HTTP calls that
 * Assistarr makes, from a small fixed library. Writes (POST/PUT/DELETE) return
 * canned successes and change nothing, so every visitor sees the same state.
 * The library is fictional/public-domain flavoured; no real media is involved.
 */

const DAY = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString();

const q = (
  id: number,
  name: string,
  resolution: number,
  source = "bluray"
) => ({
  quality: { id, name, source, resolution, modifier: "none" },
  revision: { version: 1, real: 0, isRepack: false },
});
const Q1080 = q(7, "Bluray-1080p", 1080);
const Q720 = q(4, "HDTV-720p", 720, "television");
const Q2160 = q(19, "WEBDL-2160p", 2160, "web");

// ---------------------------------------------------------------- Radarr
type MovieSeed = [
  id: number,
  title: string,
  year: number,
  tmdb: number,
  genres: string[],
  runtime: number,
  rating: number,
  overview: string,
  hasFile: boolean,
  monitored: boolean,
];

const MOVIE_SEEDS: MovieSeed[] = [
  [
    1,
    "Night of the Living Dead",
    1968,
    10_331,
    ["Horror", "Thriller"],
    96,
    7.7,
    "A group of strangers barricade themselves in a farmhouse as the dead begin to rise.",
    true,
    true,
  ],
  [
    2,
    "Metropolis",
    1927,
    19,
    ["Science Fiction", "Drama"],
    153,
    8.1,
    "In a futuristic city sharply divided between workers and planners, the son of the city's master falls in love with a working-class prophet.",
    true,
    true,
  ],
  [
    3,
    "Nosferatu",
    1922,
    653,
    ["Horror", "Fantasy"],
    94,
    7.9,
    "Count Orlok's arrival in a small German town brings plague and dread.",
    true,
    true,
  ],
  [
    4,
    "His Girl Friday",
    1940,
    3085,
    ["Comedy", "Romance"],
    92,
    7.8,
    "A newspaper editor tries to win back his ex-wife, his best reporter, before she remarries.",
    true,
    true,
  ],
  [
    5,
    "Charade",
    1963,
    4808,
    ["Comedy", "Mystery", "Romance"],
    113,
    7.9,
    "Romance and suspense in Paris as a widow is pursued by men who want a fortune her husband stole.",
    true,
    true,
  ],
  [
    6,
    "A Trip to the Moon",
    1902,
    775,
    ["Science Fiction", "Fantasy"],
    15,
    8.0,
    "A group of astronomers travel to the Moon in a cannon-launched capsule.",
    true,
    true,
  ],
  [
    7,
    "The General",
    1926,
    961,
    ["Comedy", "Action"],
    79,
    8.1,
    "A railroad engineer chases the Union soldiers who stole his locomotive.",
    false,
    true,
  ],
  [
    8,
    "Sherlock Jr.",
    1924,
    1136,
    ["Comedy"],
    45,
    8.0,
    "A projectionist daydreams himself into the film he is screening.",
    false,
    true,
  ],
];

function movieFile(id: number, title: string, year: number) {
  return {
    id,
    movieId: id,
    relativePath: `${title} (${year}).mkv`,
    path: `/media/movies/${title} (${year})/${title} (${year}).mkv`,
    size: 8_400_000_000,
    dateAdded: iso(-40),
    quality: Q1080,
    releaseGroup: "DEMO",
  };
}

function movieFromSeed(s: MovieSeed, inLibrary = true) {
  const [
    id,
    title,
    year,
    tmdbId,
    genres,
    runtime,
    rating,
    overview,
    hasFile,
    monitored,
  ] = s;
  return {
    id: inLibrary ? id : 0,
    title,
    originalTitle: title,
    sortTitle: title.toLowerCase(),
    sizeOnDisk: hasFile ? 8_400_000_000 : 0,
    status: "released" as const,
    overview,
    images: [],
    year,
    hasFile: inLibrary ? hasFile : false,
    studio: "Public Domain Pictures",
    path: `/media/movies/${title} (${year})`,
    qualityProfileId: 1,
    monitored: inLibrary ? monitored : false,
    minimumAvailability: "released" as const,
    isAvailable: true,
    folderName: `/media/movies/${title} (${year})`,
    runtime,
    cleanTitle: title.toLowerCase().replace(/[^a-z0-9]/g, ""),
    imdbId: `tt${String(tmdbId).padStart(7, "0")}`,
    tmdbId,
    titleSlug: String(tmdbId),
    rootFolderPath: "/media/movies",
    certification: "NR",
    genres,
    tags: [],
    added: iso(-60),
    ratings: { tmdb: { votes: 1200 + id * 37, value: rating, type: "user" } },
    ...(inLibrary && hasFile ? { movieFile: movieFile(id, title, year) } : {}),
  };
}

const RADARR_LIBRARY = MOVIE_SEEDS.map((s) => movieFromSeed(s));

// Not in the library: show up in lookups so "add this movie" flows work.
const RADARR_CATALOGUE: MovieSeed[] = [
  [
    0,
    "Safety Last!",
    1923,
    20_350,
    ["Comedy"],
    70,
    8.1,
    "A small-town boy tries to make good in the big city and ends up climbing a skyscraper.",
    false,
    false,
  ],
  [
    0,
    "The Cabinet of Dr. Caligari",
    1920,
    234,
    ["Horror", "Mystery"],
    76,
    7.9,
    "A hypnotist uses a sleepwalker to commit murders in a German town.",
    false,
    false,
  ],
  [
    0,
    "Duck Soup",
    1933,
    3078,
    ["Comedy"],
    68,
    7.7,
    "Rufus T. Firefly is made leader of Freedonia and promptly starts a war.",
    false,
    false,
  ],
  [
    0,
    "The Phantom of the Opera",
    1925,
    1073,
    ["Horror", "Drama"],
    93,
    7.4,
    "A disfigured composer haunts the Paris Opera House.",
    false,
    false,
  ],
];

const RADARR_QUEUE_RECORDS = [
  {
    id: 101,
    movieId: 7,
    movie: {
      id: 7,
      title: "The General",
      year: 1926,
      tmdbId: 961,
      imdbId: "tt0000961",
    },
    languages: [{ id: 1, name: "English" }],
    quality: Q1080,
    customFormats: [],
    customFormatScore: 0,
    size: 6_200_000_000,
    title: "The.General.1926.1080p.BluRay.x264-DEMO",
    sizeleft: 2_100_000_000,
    timeleft: "00:18:42",
    estimatedCompletionTime: iso(0.013),
    status: "downloading" as const,
    trackedDownloadStatus: "ok",
    trackedDownloadState: "downloading",
    statusMessages: [],
    downloadId: "DEMOHASH0000000000000000000000000000001",
    protocol: "torrent" as const,
    downloadClient: "qBittorrent",
    indexer: "Demo Indexer",
    outputPath: "/downloads/The.General.1926.1080p.BluRay.x264-DEMO",
  },
];

const PAGE = (records: unknown[]) => ({
  page: 1,
  pageSize: 20,
  sortKey: "timeleft",
  sortDirection: "ascending",
  totalRecords: records.length,
  records,
});

const QUALITY_PROFILES = [
  {
    id: 1,
    name: "HD-1080p",
    upgradeAllowed: true,
    cutoff: 7,
    items: [
      {
        quality: {
          id: 4,
          name: "HDTV-720p",
          source: "television",
          resolution: 720,
          modifier: "none",
        },
        items: [],
        allowed: true,
      },
      {
        quality: {
          id: 7,
          name: "Bluray-1080p",
          source: "bluray",
          resolution: 1080,
          modifier: "none",
        },
        items: [],
        allowed: true,
      },
    ],
  },
  {
    id: 2,
    name: "Ultra-HD",
    upgradeAllowed: true,
    cutoff: 19,
    items: [
      {
        quality: {
          id: 19,
          name: "WEBDL-2160p",
          source: "web",
          resolution: 2160,
          modifier: "none",
        },
        items: [],
        allowed: true,
      },
    ],
  },
];

const radarrCalendar = () => [
  {
    ...movieFromSeed(RADARR_CATALOGUE[0]),
    id: 9,
    monitored: true,
    inCinemas: iso(3),
    digitalRelease: iso(12),
  },
  {
    ...movieFromSeed(RADARR_CATALOGUE[2]),
    id: 10,
    monitored: true,
    physicalRelease: iso(9),
  },
  { ...movieFromSeed(MOVIE_SEEDS[7]), digitalRelease: iso(1) },
];

const radarrReleases = [
  {
    guid: "demo-rel-1",
    title: "The.General.1926.2160p.WEB-DL.DEMO",
    quality: Q2160,
    size: 14_000_000_000,
    age: 3,
    indexer: "Demo Indexer",
    protocol: "torrent",
    seeders: 42,
    leechers: 3,
    approved: true,
    rejections: [],
    movieId: 7,
    indexerId: 1,
  },
  {
    guid: "demo-rel-2",
    title: "The.General.1926.1080p.BluRay.x264-DEMO",
    quality: Q1080,
    size: 6_200_000_000,
    age: 5,
    indexer: "Demo Indexer",
    protocol: "torrent",
    seeders: 118,
    leechers: 6,
    approved: true,
    rejections: [],
    movieId: 7,
    indexerId: 1,
  },
];

// ---------------------------------------------------------------- Sonarr
type SeriesSeed = [
  id: number,
  title: string,
  year: number,
  tvdb: number,
  network: string,
  genres: string[],
  seasons: number,
  eps: number,
  have: number,
  status: "continuing" | "ended",
  overview: string,
];

const SERIES_SEEDS: SeriesSeed[] = [
  [
    1,
    "The Twilight Archive",
    2019,
    90_001,
    "Demo Network",
    ["Drama", "Mystery"],
    4,
    40,
    40,
    "ended",
    "An archivist discovers that the catalogue she maintains predicts the future.",
  ],
  [
    2,
    "Orbital Kitchen",
    2022,
    90_002,
    "Demo+",
    ["Comedy", "Science Fiction"],
    3,
    30,
    24,
    "continuing",
    "The cooks of a space station restaurant keep the galaxy's strangest diners fed.",
  ],
  [
    3,
    "Harbor Lights",
    2021,
    90_003,
    "Demo Network",
    ["Drama", "Crime"],
    2,
    20,
    20,
    "continuing",
    "A small coastal town's police force investigates things the tide leaves behind.",
  ],
  [
    4,
    "Paper Moon Detectives",
    2017,
    90_004,
    "Demo Classic",
    ["Mystery", "Comedy"],
    5,
    50,
    50,
    "ended",
    "Two retired actors solve crimes using the roles they used to play.",
  ],
  [
    5,
    "Static",
    2024,
    90_005,
    "Demo+",
    ["Science Fiction", "Thriller"],
    1,
    8,
    5,
    "continuing",
    "A radio operator keeps hearing broadcasts from tomorrow.",
  ],
];

function seriesFromSeed(s: SeriesSeed, inLibrary = true) {
  const [
    id,
    title,
    year,
    tvdbId,
    network,
    genres,
    seasons,
    eps,
    have,
    status,
    overview,
  ] = s;
  const perSeason = Math.round(eps / seasons);
  return {
    id: inLibrary ? id : 0,
    title,
    sortTitle: title.toLowerCase(),
    status,
    ended: status === "ended",
    overview,
    network,
    airTime: "20:00",
    images: [],
    seasons: Array.from({ length: seasons }, (_, i) => ({
      seasonNumber: i + 1,
      monitored: true,
      statistics: {
        episodeFileCount: inLibrary
          ? Math.min(perSeason, Math.max(0, have - i * perSeason))
          : 0,
        episodeCount: perSeason,
        totalEpisodeCount: perSeason,
        sizeOnDisk: 0,
        percentOfEpisodes: 100,
      },
    })),
    year,
    path: `/media/tv/${title}`,
    qualityProfileId: 1,
    languageProfileId: 1,
    seasonFolder: true,
    monitored: inLibrary,
    useSceneNumbering: false,
    runtime: 45,
    tvdbId,
    firstAired: `${year}-03-01`,
    seriesType: "standard" as const,
    cleanTitle: title.toLowerCase().replace(/[^a-z0-9]/g, ""),
    imdbId: `tt${String(tvdbId).padStart(7, "0")}`,
    titleSlug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    rootFolderPath: "/media/tv",
    certification: "TV-14",
    genres,
    tags: [],
    added: iso(-90),
    ratings: { votes: 800 + id * 21, value: 7.5 + (id % 3) * 0.4 },
    statistics: {
      seasonCount: seasons,
      episodeFileCount: inLibrary ? have : 0,
      episodeCount: eps,
      totalEpisodeCount: eps,
      sizeOnDisk: have * 1_200_000_000,
      percentOfEpisodes: Math.round((have / eps) * 100),
    },
  };
}

const SONARR_LIBRARY = SERIES_SEEDS.map((s) => seriesFromSeed(s));

const SONARR_CATALOGUE: SeriesSeed[] = [
  [
    0,
    "Lighthouse Keepers",
    2023,
    90_101,
    "Demo Network",
    ["Drama"],
    2,
    16,
    0,
    "continuing",
    "Two families tend the same lighthouse a century apart.",
  ],
  [
    0,
    "The Long Tuesday",
    2020,
    90_102,
    "Demo Classic",
    ["Comedy"],
    3,
    30,
    0,
    "ended",
    "Every episode is the same Tuesday, slightly worse.",
  ],
];

const episode = (
  id: number,
  seriesId: number,
  season: number,
  ep: number,
  title: string,
  offsetDays: number,
  hasFile: boolean
) => {
  const series = SERIES_SEEDS.find((s) => s[0] === seriesId) as SeriesSeed;
  const airDateUtc = iso(offsetDays);
  return {
    id,
    seriesId,
    tvdbId: 900_000 + id,
    episodeFileId: hasFile ? id : 0,
    seasonNumber: season,
    episodeNumber: ep,
    title,
    airDate: airDateUtc.slice(0, 10),
    airDateUtc,
    overview: `${series[1]}, season ${season} episode ${ep}.`,
    hasFile,
    monitored: true,
    series: seriesFromSeed(series),
  };
};

const sonarrCalendar = () => [
  episode(501, 2, 3, 7, "Flambe in Zero-G", 1, false),
  episode(502, 3, 2, 9, "Low Tide", 2, false),
  episode(503, 5, 1, 6, "Signal Lost", 4, false),
  episode(504, 2, 3, 8, "The Salt Problem", 8, false),
];

const SONARR_QUEUE_RECORDS = [
  {
    id: 201,
    seriesId: 2,
    episodeId: 480,
    seasonNumber: 3,
    series: { id: 2, title: "Orbital Kitchen" },
    episode: {
      id: 480,
      seasonNumber: 3,
      episodeNumber: 6,
      title: "Reservation for Nine",
    },
    quality: Q720,
    size: 1_400_000_000,
    title: "Orbital.Kitchen.S03E06.720p.HDTV.x264-DEMO",
    sizeleft: 350_000_000,
    timeleft: "00:04:10",
    estimatedCompletionTime: iso(0.003),
    status: "downloading" as const,
    trackedDownloadStatus: "ok",
    trackedDownloadState: "downloading",
    statusMessages: [],
    downloadId: "DEMOHASH0000000000000000000000000000002",
    protocol: "torrent" as const,
    downloadClient: "qBittorrent",
    indexer: "Demo Indexer",
    outputPath: "/downloads/Orbital.Kitchen.S03E06",
  },
  {
    id: 202,
    seriesId: 5,
    episodeId: 560,
    seasonNumber: 1,
    series: { id: 5, title: "Static" },
    episode: { id: 560, seasonNumber: 1, episodeNumber: 5, title: "Dead Air" },
    quality: Q1080,
    size: 2_100_000_000,
    title: "Static.S01E05.1080p.WEB.h264-DEMO",
    sizeleft: 1_900_000_000,
    timeleft: "00:41:00",
    estimatedCompletionTime: iso(0.03),
    status: "queued" as const,
    trackedDownloadStatus: "ok",
    trackedDownloadState: "downloading",
    statusMessages: [],
    downloadId: "DEMOHASH0000000000000000000000000000003",
    protocol: "torrent" as const,
    downloadClient: "qBittorrent",
    indexer: "Demo Indexer",
    outputPath: "/downloads/Static.S01E05",
  },
];

const SYSTEM_STATUS = (appName: string, version: string) => ({
  appName,
  version,
  buildTime: "2026-01-01T00:00:00Z",
  isDebug: false,
  isProduction: true,
  isAdmin: false,
  isUserInteractive: false,
  startupPath: "/app",
  appData: "/config",
  osName: "debian",
  osVersion: "12",
  isNetCore: true,
  isLinux: true,
  isOsx: false,
  isWindows: false,
  isDocker: true,
  mode: "console",
  branch: "main",
  authentication: "forms",
  sqliteVersion: "3.45.0",
  urlBase: "",
  runtimeVersion: "8.0.0",
  runtimeName: "dotnet",
  startTime: iso(-3),
  packageVersion: version,
  packageAuthor: "demo",
  packageUpdateMechanism: "docker",
});

const ROOT = (path: string) => [
  { id: 1, path, accessible: true, freeSpace: 4_200_000_000_000 },
];

const COMMAND = (name: string) => ({
  id: 9000,
  name,
  commandName: name,
  message: "Demo mode: command accepted, nothing was changed.",
  body: {},
  priority: "normal",
  status: "completed",
  result: "successful",
  queued: iso(0),
  started: iso(0),
  ended: iso(0),
  trigger: "manual",
  stateChangeTime: iso(0),
});

// ---------------------------------------------------------------- qBittorrent
const TORRENTS = [
  {
    hash: "demohash0000000000000000000000000000001",
    name: "The.General.1926.1080p.BluRay.x264-DEMO",
    size: 6_200_000_000,
    progress: 0.66,
    dlspeed: 8_400_000,
    upspeed: 250_000,
    num_seeds: 118,
    num_leechs: 6,
    state: "downloading",
    eta: 1122,
    ratio: 0.1,
    category: "radarr",
    added_on: Math.floor(Date.now() / 1000) - 1800,
    save_path: "/downloads",
    total_size: 6_200_000_000,
    downloaded: 4_100_000_000,
    uploaded: 400_000_000,
  },
  {
    hash: "demohash0000000000000000000000000000002",
    name: "Orbital.Kitchen.S03E06.720p.HDTV.x264-DEMO",
    size: 1_400_000_000,
    progress: 0.75,
    dlspeed: 5_100_000,
    upspeed: 90_000,
    num_seeds: 54,
    num_leechs: 2,
    state: "downloading",
    eta: 250,
    ratio: 0,
    category: "sonarr",
    added_on: Math.floor(Date.now() / 1000) - 900,
    save_path: "/downloads",
    total_size: 1_400_000_000,
    downloaded: 1_050_000_000,
    uploaded: 0,
  },
  {
    hash: "demohash0000000000000000000000000000003",
    name: "Static.S01E05.1080p.WEB.h264-DEMO",
    size: 2_100_000_000,
    progress: 0.09,
    dlspeed: 0,
    upspeed: 0,
    num_seeds: 31,
    num_leechs: 1,
    state: "queuedDL",
    eta: 8_640_000,
    ratio: 0,
    category: "sonarr",
    added_on: Math.floor(Date.now() / 1000) - 300,
    save_path: "/downloads",
    total_size: 2_100_000_000,
    downloaded: 190_000_000,
    uploaded: 0,
  },
  {
    hash: "demohash0000000000000000000000000000004",
    name: "Charade.1963.1080p.BluRay.x264-DEMO",
    size: 8_400_000_000,
    progress: 1,
    dlspeed: 0,
    upspeed: 120_000,
    num_seeds: 200,
    num_leechs: 0,
    state: "stalledUP",
    eta: 8_640_000,
    ratio: 2.3,
    category: "radarr",
    added_on: Math.floor(Date.now() / 1000) - 86_400 * 40,
    save_path: "/downloads",
    total_size: 8_400_000_000,
    downloaded: 8_400_000_000,
    uploaded: 19_300_000_000,
  },
];

const TRANSFER_INFO = {
  dl_info_speed: 13_500_000,
  dl_info_data: 5_340_000_000,
  up_info_speed: 460_000,
  up_info_data: 19_800_000_000,
  dl_rate_limit: 0,
  up_rate_limit: 0,
  dht_nodes: 312,
  connection_status: "connected",
};

// ---------------------------------------------------------------- Jellyseerr / Jellyfin
const JELLYSEERR_RESULTS = [
  ...RADARR_CATALOGUE.map((m, i) => ({
    id: m[3],
    mediaType: "movie",
    title: m[1],
    releaseDate: `${m[2]}-01-01`,
    overview: m[7],
    posterPath: null,
    voteAverage: m[6],
    mediaInfo: i === 0 ? undefined : undefined,
  })),
  ...SONARR_CATALOGUE.map((s) => ({
    id: s[3],
    mediaType: "tv",
    name: s[1],
    firstAirDate: `${s[2]}-01-01`,
    overview: s[10],
    posterPath: null,
    voteAverage: 7.6,
  })),
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const text = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

function matches(haystack: string, term: string) {
  const t = term.toLowerCase().trim();
  return (
    !t ||
    haystack.toLowerCase().includes(t) ||
    t.split(/\s+/).every((w) => haystack.toLowerCase().includes(w))
  );
}

function radarr(method: string, path: string, params: URLSearchParams) {
  if (method !== "GET") {
    if (path === "/movie" && method === "POST") {
      return json({ ...RADARR_LIBRARY[6], id: 99, monitored: true });
    }
    return json(path.startsWith("/command") ? COMMAND("DemoCommand") : {});
  }
  switch (path) {
    case "/system/status":
      return json(SYSTEM_STATUS("Radarr", "5.14.0.9383"));
    case "/movie":
      return json(RADARR_LIBRARY);
    case "/movie/lookup": {
      const term = params.get("term") ?? "";
      const all = [
        ...RADARR_LIBRARY,
        ...RADARR_CATALOGUE.map((s) => movieFromSeed(s, false)),
      ];
      return json(
        all.filter((m) =>
          matches(`${m.title} ${m.year} ${m.genres.join(" ")}`, term)
        )
      );
    }
    case "/queue":
      return json(PAGE(RADARR_QUEUE_RECORDS));
    case "/calendar":
      return json(radarrCalendar());
    case "/qualityprofile":
      return json(QUALITY_PROFILES);
    case "/rootfolder":
      return json(ROOT("/media/movies"));
    case "/release":
      return json(radarrReleases);
    case "/moviefile":
      return json(
        RADARR_LIBRARY.filter((m) => m.hasFile).map((m) => m.movieFile)
      );
    case "/history":
    case "/blocklist":
      return json(PAGE([]));
    case "/command":
      return json([]);
    default:
      return json([]);
  }
}

function sonarr(method: string, path: string, params: URLSearchParams) {
  if (method !== "GET") {
    return json(path.startsWith("/command") ? COMMAND("DemoCommand") : {});
  }
  switch (path) {
    case "/system/status":
      return json(SYSTEM_STATUS("Sonarr", "4.0.11.2680"));
    case "/series":
      return json(SONARR_LIBRARY);
    case "/series/lookup": {
      const term = params.get("term") ?? "";
      const all = [
        ...SONARR_LIBRARY,
        ...SONARR_CATALOGUE.map((s) => seriesFromSeed(s, false)),
      ];
      return json(
        all.filter((s) =>
          matches(`${s.title} ${s.year} ${s.genres.join(" ")}`, term)
        )
      );
    }
    case "/queue":
      return json(PAGE(SONARR_QUEUE_RECORDS));
    case "/calendar":
      return json(sonarrCalendar());
    case "/qualityprofile":
      return json(QUALITY_PROFILES);
    case "/rootfolder":
      return json(ROOT("/media/tv"));
    case "/release":
      return json([]);
    case "/history":
    case "/blocklist":
      return json(PAGE([]));
    case "/command":
      return json([]);
    default:
      return json([]);
  }
}

function qbittorrent(method: string, path: string) {
  if (path === "/auth/login") {
    return text("Ok.");
  }
  if (path === "/app/version") {
    return text("v5.0.2");
  }
  if (path === "/torrents/info") {
    return json(TORRENTS);
  }
  if (path === "/transfer/info") {
    return json(TRANSFER_INFO);
  }
  if (path === "/sync/maindata") {
    return json({
      rid: 1,
      full_update: true,
      server_state: TRANSFER_INFO,
      torrents: {},
    });
  }
  return method === "GET" ? json([]) : text("Ok.");
}

function jellyseerr(method: string, path: string, params: URLSearchParams) {
  if (path === "/status") {
    return json({ version: "2.1.0" });
  }
  if (path === "/search") {
    const term = params.get("query") ?? "";
    const results = JELLYSEERR_RESULTS.filter((r) =>
      matches(String("title" in r ? r.title : r.name), term)
    );
    return json({
      page: 1,
      totalPages: 1,
      totalResults: results.length,
      results,
    });
  }
  if (method === "POST" && path === "/request") {
    return json({ id: 1, status: 2, type: "movie" });
  }
  return json(
    method === "GET" ? { results: [], pageInfo: { results: 0, pages: 1 } } : {}
  );
}

function jellyfin(path: string) {
  if (path.startsWith("/System/Info")) {
    return json({
      ServerName: "Demo Jellyfin",
      Version: "10.10.0",
      Id: "demo",
    });
  }
  if (path === "/Users") {
    return json([{ Id: "demo-user", Name: "demo" }]);
  }
  return json({ Items: [], TotalRecordCount: 0, StartIndex: 0 });
}

/** Handle one demo request. `url` must be rooted at DEMO_BASE_URL/<service>. */
export function demoFetch(url: string, init?: RequestInit): Response {
  const u = new URL(url);
  const [, service, ...rest] = u.pathname.split("/");
  const method = (init?.method ?? "GET").toUpperCase();
  const path = `/${rest.join("/")}`;
  const params = u.searchParams;

  switch (service) {
    case "radarr":
      return radarr(method, path.replace(/^\/api\/v3/, ""), params);
    case "sonarr":
      return sonarr(method, path.replace(/^\/api\/v3/, ""), params);
    case "qbittorrent":
      return qbittorrent(method, path.replace(/^\/api\/v2/, ""));
    case "jellyseerr":
      return jellyseerr(method, path.replace(/^\/api\/v1/, ""), params);
    case "jellyfin":
      return jellyfin(path);
    default:
      return json({ error: "Unknown demo service" }, 404);
  }
}
