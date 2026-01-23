/**
 * Deduplicated Cache System for Recommendations
 *
 * This cache accumulates unique items up to a maximum count (default 6).
 * Items are deduplicated by tmdbId or id property.
 * Supports progressive loading: load 3 items initially, then 3 more for performance.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface FIFOCacheSlot<T> {
  data: T[];
  timestamp: number;
}

export interface FIFOCacheData<T> {
  items: T[]; // All unique items
  lastFetch: number;
  fetchCount: number; // How many times we've fetched (for progressive loading)
}

export interface FIFOCacheOptions {
  /** Time-to-live in milliseconds (default: 12 hours) */
  ttlMs?: number;
  /** Maximum number of unique items to store (default: 6) */
  maxItems?: number;
  /** Items per fetch batch (default: 3) */
  itemsPerSlot?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const DEFAULT_MAX_ITEMS = 6;
const STORAGE_PREFIX = "assistarr_fifo_cache_";

// =============================================================================
// Storage Helpers
// =============================================================================

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Core Cache Functions
// =============================================================================

/**
 * Get the cache data for a given key
 */
export function getCache<T>(key: string): FIFOCacheData<T> | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(getStorageKey(key));
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as FIFOCacheData<T>;
  } catch {
    return null;
  }
}

/**
 * Set the cache data for a given key
 */
export function setCache<T>(key: string, data: FIFOCacheData<T>): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(data));
    return true;
  } catch {
    // Storage quota exceeded or other error
    return false;
  }
}

/**
 * Clear the cache for a given key
 */
export function clearCache(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(getStorageKey(key));
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize an empty cache structure
 */
export function createEmptyCache<T>(): FIFOCacheData<T> {
  return {
    items: [],
    lastFetch: 0,
    fetchCount: 0,
  };
}

/**
 * Add new items to the cache, deduplicating by id/tmdbId
 * Returns true if new unique items were added
 */
export function rotateCache<T>(
  key: string,
  newData: T[],
  options: FIFOCacheOptions = {}
): FIFOCacheData<T> {
  let existingCache = getCache<T>(key);

  // Handle old cache format or invalid cache
  if (
    !existingCache ||
    !existingCache.items ||
    !Array.isArray(existingCache.items)
  ) {
    existingCache = createEmptyCache<T>();
  }

  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  const now = Date.now();

  // Build set of existing IDs
  const existingIds = new Set<number | string>();
  for (const item of existingCache.items) {
    const id = getItemId(item);
    if (id !== null) {
      existingIds.add(id);
    }
  }

  // Add new unique items
  const updatedItems = [...existingCache.items];
  for (const item of newData) {
    const id = getItemId(item);
    if (id === null || !existingIds.has(id)) {
      if (id !== null) {
        existingIds.add(id);
      }
      updatedItems.push(item);
    }
  }

  // Trim to max items (keep most recent)
  const trimmedItems = updatedItems.slice(-maxItems);

  const updatedCache: FIFOCacheData<T> = {
    items: trimmedItems,
    lastFetch: now,
    fetchCount: existingCache.fetchCount + 1,
  };

  setCache(key, updatedCache);
  return updatedCache;
}

/**
 * Check if the cache is expired or needs more items
 */
export function isFreshSlotExpired(
  cache: FIFOCacheData<unknown> | null,
  options: FIFOCacheOptions = {}
): boolean {
  // Handle null or invalid cache
  if (
    !cache ||
    !cache.items ||
    !Array.isArray(cache.items) ||
    cache.items.length === 0
  ) {
    return true;
  }

  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  return now - (cache.lastFetch || 0) > ttlMs;
}

/**
 * Check if cache needs more items (hasn't reached max)
 */
export function needsMoreItems(
  cache: FIFOCacheData<unknown> | null,
  options: FIFOCacheOptions = {}
): boolean {
  // Handle null or invalid cache
  if (!cache || !cache.items || !Array.isArray(cache.items)) {
    return true;
  }
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  return cache.items.length < maxItems;
}

/**
 * Check if a specific slot is expired (legacy compatibility)
 */
export function isSlotExpired(
  slot: FIFOCacheSlot<unknown> | null,
  options: FIFOCacheOptions = {}
): boolean {
  if (!slot) {
    return true;
  }

  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  return now - slot.timestamp > ttlMs;
}

/**
 * Extract unique identifier from an item (tmdbId or id)
 */
function getItemId<T>(item: T): number | string | null {
  const anyItem = item as Record<string, unknown>;
  if (
    typeof anyItem.tmdbId === "number" ||
    typeof anyItem.tmdbId === "string"
  ) {
    return anyItem.tmdbId;
  }
  if (typeof anyItem.id === "number" || typeof anyItem.id === "string") {
    return anyItem.id;
  }
  return null;
}

/**
 * Get all unique items from the cache
 */
export function getAllItems<T>(
  key: string,
  options: FIFOCacheOptions = {}
): T[] {
  const cache = getCache<T>(key);
  if (!cache) {
    return [];
  }

  // Handle missing items property (old cache format or corrupted data)
  if (!cache.items || !Array.isArray(cache.items)) {
    // Clear old cache format
    clearCache(key);
    return [];
  }

  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  // Return empty if cache is expired
  if (now - cache.lastFetch > ttlMs) {
    return [];
  }

  return cache.items;
}

/**
 * Get items from cache (alias for getAllItems for compatibility)
 */
export function getFreshItems<T>(
  key: string,
  options: FIFOCacheOptions = {}
): T[] {
  return getAllItems(key, options);
}

/**
 * Get cache metadata
 */
export function getCacheMetadata(key: string): {
  itemCount: number;
  lastFetch: number | null;
  fetchCount: number;
  isExpired: boolean;
} | null {
  const cache = getCache<unknown>(key);
  if (!cache) {
    return null;
  }

  const ttlMs = DEFAULT_TTL_MS;
  const now = Date.now();

  return {
    itemCount: cache.items.length,
    lastFetch: cache.lastFetch || null,
    fetchCount: cache.fetchCount,
    isExpired: now - cache.lastFetch > ttlMs,
  };
}
