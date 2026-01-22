import { createClient, type RedisClientType } from "redis";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

/**
 * Sliding window rate limiter with Redis and in-memory fallback
 *
 * Uses the sliding window log algorithm for accurate rate limiting:
 * - Stores timestamps of each request
 * - Removes expired timestamps outside the window
 * - Counts remaining timestamps to check limit
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until the oldest entry expires
}

interface RateLimiterOptions {
  windowMs: number; // Window size in milliseconds
  maxRequests: number; // Maximum requests per window
}

// In-memory store for development fallback
const inMemoryStore = new Map<string, number[]>();

// Redis client singleton
let redisClient: RedisClientType | null = null;
let redisConnectionFailed = false;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisConnectionFailed) {
    return null;
  }

  if (!env.REDIS_URL) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({ url: env.REDIS_URL });

    redisClient.on("error", (err) => {
      log.error({ err }, "Redis client error");
      redisConnectionFailed = true;
      redisClient = null;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    log.warn(
      { err: error },
      "Failed to connect to Redis, using in-memory rate limiting"
    );
    redisConnectionFailed = true;
    return null;
  }
}

/**
 * Check rate limit using Redis (with Lua script for atomicity)
 */
async function checkRateLimitRedis(
  client: RedisClientType,
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  // Use a Lua script for atomic operation
  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local maxRequests = tonumber(ARGV[3])
    local windowMs = tonumber(ARGV[4])

    -- Remove expired entries
    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

    -- Count current requests in window
    local count = redis.call('ZCARD', key)

    if count < maxRequests then
      -- Add new request timestamp
      redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
      -- Set expiry on the key
      redis.call('PEXPIRE', key, windowMs)

      -- Get oldest entry for reset time calculation
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local resetIn = 0
      if #oldest >= 2 then
        resetIn = tonumber(oldest[2]) + windowMs - now
      end

      return {1, maxRequests - count - 1, resetIn}
    else
      -- Get oldest entry for reset time calculation
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local resetIn = 0
      if #oldest >= 2 then
        resetIn = tonumber(oldest[2]) + windowMs - now
      end

      return {0, 0, resetIn}
    end
  `;

  try {
    const result = (await client.eval(luaScript, {
      keys: [redisKey],
      arguments: [
        now.toString(),
        windowStart.toString(),
        maxRequests.toString(),
        windowMs.toString(),
      ],
    })) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetIn: Math.max(0, result[2]),
    };
  } catch (error) {
    log.error({ err: error }, "Redis rate limit check failed");
    // Fall back to in-memory on error
    return checkRateLimitInMemory(key, windowMs, maxRequests);
  }
}

/**
 * Check rate limit using in-memory store (for development)
 */
function checkRateLimitInMemory(
  key: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps or create new array
  let timestamps = inMemoryStore.get(key) || [];

  // Remove expired timestamps
  timestamps = timestamps.filter((ts) => ts > windowStart);

  if (timestamps.length < maxRequests) {
    // Add new timestamp
    timestamps.push(now);
    inMemoryStore.set(key, timestamps);

    const resetIn =
      timestamps.length > 0
        ? Math.max(0, timestamps[0] + windowMs - now)
        : windowMs;

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      resetIn,
    };
  }

  // Rate limited
  const resetIn =
    timestamps.length > 0
      ? Math.max(0, timestamps[0] + windowMs - now)
      : windowMs;

  // Update store with cleaned timestamps (even when rate limited)
  inMemoryStore.set(key, timestamps);

  return {
    allowed: false,
    remaining: 0,
    resetIn,
  };
}

/**
 * Periodically clean up expired entries from in-memory store
 * Call this in a background task or periodically
 */
export function cleanupInMemoryStore(windowMs: number): void {
  const now = Date.now();
  const windowStart = now - windowMs;

  for (const [key, timestamps] of inMemoryStore.entries()) {
    const filtered = timestamps.filter((ts) => ts > windowStart);
    if (filtered.length === 0) {
      inMemoryStore.delete(key);
    } else {
      inMemoryStore.set(key, filtered);
    }
  }
}

/**
 * Main rate limiter class
 */
export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Check if a request is allowed for the given key
   * @param key Unique identifier (e.g., user ID)
   * @returns RateLimitResult with allowed status and metadata
   */
  async check(key: string): Promise<RateLimitResult> {
    const client = await getRedisClient();

    if (client) {
      return checkRateLimitRedis(client, key, this.windowMs, this.maxRequests);
    }

    return checkRateLimitInMemory(key, this.windowMs, this.maxRequests);
  }

  /**
   * Check if a request is allowed without incrementing the counter
   * Useful for checking status without consuming a request
   */
  async peek(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const client = await getRedisClient();

    if (client) {
      const redisKey = `ratelimit:${key}`;
      try {
        // Remove expired and count without adding
        await client.zRemRangeByScore(redisKey, "-inf", windowStart);
        const count = await client.zCard(redisKey);
        const oldest = await client.zRange(redisKey, 0, 0, { REV: false });
        const oldestScore =
          oldest.length > 0 ? await client.zScore(redisKey, oldest[0]) : null;

        const resetIn = oldestScore
          ? Math.max(0, oldestScore + this.windowMs - now)
          : this.windowMs;

        return {
          allowed: count < this.maxRequests,
          remaining: Math.max(0, this.maxRequests - count),
          resetIn,
        };
      } catch (error) {
        log.error({ err: error }, "Redis peek failed");
      }
    }

    // In-memory peek
    const timestamps = inMemoryStore.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);
    const resetIn =
      validTimestamps.length > 0
        ? Math.max(0, validTimestamps[0] + this.windowMs - now)
        : this.windowMs;

    return {
      allowed: validTimestamps.length < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - validTimestamps.length),
      resetIn,
    };
  }
}

/**
 * Create a rate limiter for per-minute limiting
 */
export function createPerMinuteRateLimiter(maxRequests: number): RateLimiter {
  return new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests,
  });
}

// Cleanup interval for in-memory store (runs every minute)
if (typeof setInterval !== "undefined") {
  setInterval(() => cleanupInMemoryStore(60 * 1000), 60 * 1000);
}
