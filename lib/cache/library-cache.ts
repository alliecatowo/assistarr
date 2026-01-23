import { LRUCache } from "lru-cache";
import { createLogger } from "../logger";

const log = createLogger("cache:library");

// =============================================================================
// Type Definitions (compatible with discover routes)
// =============================================================================

interface PersonCount {
  id: number;
  name: string;
  count: number;
  profilePath?: string;
}

interface GenreCount {
  genre: string;
  count: number;
  percentage?: number;
}

interface DecadeCount {
  decade: string;
  count: number;
  percentage?: number;
}

interface StudioCount {
  studio: string;
  count: number;
}

interface NetworkCount {
  network: string;
  count: number;
}

interface RecentItem {
  title: string;
  tmdbId: number;
  year: number;
  genres: string[];
  mediaType: "movie" | "tv";
}

export interface LibraryProfile {
  topGenres: GenreCount[];
  favoriteDirectors: PersonCount[];
  favoriteActors: PersonCount[];
  favoriteDecades: DecadeCount[];
  favoriteStudios: StudioCount[];
  favoriteNetworks: NetworkCount[];
  recentlyAdded: RecentItem[];
  totalMovies: number;
  totalShows: number;
  averageRating: number;
  totalRuntimeHours: number;
  totalSizeGB: number;
  genreDiversityScore: number;
  prefersMovies: boolean;
  prefersTv: boolean;
  topYears: { year: number; count: number }[];
  cachedAt: Date;
}

// Simplified profile for top-picks (compatible with top-picks route)
export interface SimpleTasteProfile {
  topGenres: { genre: string; count: number }[];
  topDirectors: { id: number; name: string; count: number }[];
  topActors: { id: number; name: string; count: number }[];
  topDecades: { decade: string; count: number }[];
  recentAdditions: string[];
  totalItems: number;
  averageRating: number;
  prefersMovies: boolean;
  prefersTv: boolean;
}

// =============================================================================
// Cache Configuration
// =============================================================================

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const MAX_CACHED_PROFILES = 100;

// LRU cache for library profiles
const profileCache = new LRUCache<string, LibraryProfile>({
  max: MAX_CACHED_PROFILES,
  ttl: CACHE_TTL_MS,
});

// Track in-flight requests to prevent duplicate fetches
const inFlightRequests = new Map<string, Promise<LibraryProfile | null>>();

// =============================================================================
// Cache Operations
// =============================================================================

/**
 * Get a library profile from cache
 */
export function getCachedProfile(userId: string): LibraryProfile | null {
  const cached = profileCache.get(userId);
  if (cached) {
    log.debug({ userId }, "Cache hit for library profile");
    return cached;
  }
  log.debug({ userId }, "Cache miss for library profile");
  return null;
}

/**
 * Set a library profile in cache
 */
export function setCachedProfile(
  userId: string,
  profile: LibraryProfile
): void {
  profile.cachedAt = new Date();
  profileCache.set(userId, profile);
  log.debug({ userId }, "Cached library profile");
}

/**
 * Invalidate a user's cached library profile
 * Call this when the user adds or removes media
 */
export function invalidateUserCache(userId: string): void {
  profileCache.delete(userId);
  log.info({ userId }, "Invalidated library profile cache");
}

/**
 * Get or fetch a library profile with request deduplication
 * If a fetch is already in progress for this user, wait for it instead of starting another
 */
export function getOrFetchProfile(
  userId: string,
  fetchFn: () => Promise<LibraryProfile | null>
): Promise<LibraryProfile | null> {
  // Check cache first
  const cached = getCachedProfile(userId);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Check if there's already a request in flight
  const inFlight = inFlightRequests.get(userId);
  if (inFlight) {
    log.debug({ userId }, "Waiting for in-flight request");
    return inFlight;
  }

  // Start new fetch
  log.debug({ userId }, "Starting new profile fetch");
  const fetchPromise = fetchFn()
    .then((profile) => {
      if (profile) {
        setCachedProfile(userId, profile);
      }
      return profile;
    })
    .finally(() => {
      inFlightRequests.delete(userId);
    });

  inFlightRequests.set(userId, fetchPromise);
  return fetchPromise;
}

/**
 * Convert a full LibraryProfile to SimpleTasteProfile for top-picks route
 */
export function toSimpleTasteProfile(
  profile: LibraryProfile
): SimpleTasteProfile {
  return {
    topGenres: profile.topGenres.map((g) => ({
      genre: g.genre,
      count: g.count,
    })),
    topDirectors: profile.favoriteDirectors.map((d) => ({
      id: d.id,
      name: d.name,
      count: d.count,
    })),
    topActors: profile.favoriteActors.map((a) => ({
      id: a.id,
      name: a.name,
      count: a.count,
    })),
    topDecades: profile.favoriteDecades.map((d) => ({
      decade: d.decade,
      count: d.count,
    })),
    recentAdditions: profile.recentlyAdded.map((r) => r.title),
    totalItems: profile.totalMovies + profile.totalShows,
    averageRating: profile.averageRating,
    prefersMovies: profile.prefersMovies,
    prefersTv: profile.prefersTv,
  };
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    size: profileCache.size,
    maxSize: MAX_CACHED_PROFILES,
    ttlMs: CACHE_TTL_MS,
  };
}
