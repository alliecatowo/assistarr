"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type FIFOCacheOptions,
  getAllItems,
  getCache,
  isFreshSlotExpired,
  needsMoreItems,
  rotateCache,
} from "@/lib/cache/fifo-cache";

// =============================================================================
// Types
// =============================================================================

export interface UseFIFOCacheOptions extends FIFOCacheOptions {
  /** Number of items to request from the fetch function per batch (default: 3) */
  count?: number;
  /** Whether to auto-refresh when cache expires (default: true) */
  autoRefresh?: boolean;
  /** Whether to progressively load more items (default: true) */
  progressiveLoad?: boolean;
}

export interface UseFIFOCacheResult<T> {
  /** All unique items from cache (up to maxItems, default 6) */
  items: T[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt */
  error: Error | null;
  /** Manually trigger a refresh (clears cache and fetches fresh data) */
  refresh: () => Promise<void>;
  /** Whether the cache has any data */
  hasData: boolean;
  /** Whether the cache is expired and needs refresh */
  isStale: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_AUTO_REFRESH = true;
const DEFAULT_PROGRESSIVE_LOAD = true;
const PROGRESSIVE_LOAD_DELAY = 100; // ms delay before fetching second batch

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * React hook for managing deduplicated cache with progressive loading
 *
 * @param key - Unique cache key
 * @param fetchFn - Async function that fetches new data
 * @param options - Configuration options
 * @returns Cache state and control functions
 *
 * @example
 * ```tsx
 * const { items, isLoading, refresh } = useFIFOCache(
 *   'top-picks',
 *   () => fetch('/api/top-picks?count=3').then(r => r.json()),
 *   { maxItems: 6 }
 * );
 * ```
 */
export function useFIFOCache<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  options: UseFIFOCacheOptions = {}
): UseFIFOCacheResult<T> {
  const {
    autoRefresh = DEFAULT_AUTO_REFRESH,
    progressiveLoad = DEFAULT_PROGRESSIVE_LOAD,
    ttlMs,
    itemsPerSlot,
    maxItems,
  } = options;

  // Memoize cache options to prevent unnecessary re-renders
  const cacheOptions: FIFOCacheOptions = useMemo(
    () => ({ ttlMs, itemsPerSlot, maxItems }),
    [ttlMs, itemsPerSlot, maxItems]
  );

  // State
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Refs for preventing duplicate fetches
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Load initial data from cache on mount
  useEffect(() => {
    mountedRef.current = true;
    initialLoadDoneRef.current = false;

    const cache = getCache<T>(key);
    const cachedItems = getAllItems<T>(key, cacheOptions);

    if (cachedItems.length > 0) {
      setItems(cachedItems);
    }

    // Check if cache is expired
    const expired = isFreshSlotExpired(cache, cacheOptions);
    setIsStale(expired);

    return () => {
      mountedRef.current = false;
    };
  }, [key, cacheOptions]);

  // Fetch and add to cache
  const fetchAndAdd = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFn();

      if (!mountedRef.current) {
        return;
      }

      // Add new items to cache (deduplicates automatically)
      rotateCache(key, newData, cacheOptions);

      // Get all items from cache
      const allItems = getAllItems<T>(key, cacheOptions);
      setItems(allItems);
      setIsStale(false);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      const fetchError =
        err instanceof Error ? err : new Error("Failed to fetch data");
      setError(fetchError);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [fetchFn, key, cacheOptions]);

  // Refresh function - fetches new data and adds to cache
  const refresh = useCallback(async () => {
    await fetchAndAdd();

    // If progressive loading is enabled and we need more items, fetch again
    if (progressiveLoad && mountedRef.current) {
      const cache = getCache<T>(key);
      if (needsMoreItems(cache, cacheOptions)) {
        setTimeout(() => {
          if (mountedRef.current && !isFetchingRef.current) {
            fetchAndAdd();
          }
        }, PROGRESSIVE_LOAD_DELAY);
      }
    }
  }, [fetchAndAdd, progressiveLoad, key, cacheOptions]);

  // Initial load and progressive loading
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      return;
    }

    const cache = getCache<T>(key);
    const expired = isFreshSlotExpired(cache, cacheOptions);
    const needMore = needsMoreItems(cache, cacheOptions);

    // If cache is empty or expired, fetch initial batch
    if (expired || items.length === 0) {
      initialLoadDoneRef.current = true;
      fetchAndAdd().then(() => {
        // After initial fetch, check if we need more items
        if (progressiveLoad && mountedRef.current) {
          const updatedCache = getCache<T>(key);
          if (needsMoreItems(updatedCache, cacheOptions)) {
            setTimeout(() => {
              if (mountedRef.current && !isFetchingRef.current) {
                fetchAndAdd();
              }
            }, PROGRESSIVE_LOAD_DELAY);
          }
        }
      });
    } else if (needMore && progressiveLoad) {
      // Cache has items but not full, fetch more
      initialLoadDoneRef.current = true;
      fetchAndAdd();
    } else {
      initialLoadDoneRef.current = true;
    }
  }, [fetchAndAdd, progressiveLoad, key, cacheOptions, items.length]);

  // Auto-refresh when cache expires
  useEffect(() => {
    if (!autoRefresh || !initialLoadDoneRef.current) {
      return;
    }

    const cache = getCache<T>(key);
    const expired = isFreshSlotExpired(cache, cacheOptions);

    if (expired && !isLoading && !isFetchingRef.current) {
      refresh();
    }
  }, [autoRefresh, key, cacheOptions, isLoading, refresh]);

  return {
    items,
    isLoading,
    error,
    refresh,
    hasData: items.length > 0,
    isStale,
  };
}
