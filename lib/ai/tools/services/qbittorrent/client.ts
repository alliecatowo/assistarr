import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";

const SERVICE_NAME = "qbittorrent";

/**
 * In-memory session cache to avoid re-authenticating on every request.
 * Maps baseUrl -> { sid, expiresAt }
 */
const sessionCache = new Map<string, { sid: string; expiresAt: number }>();

// Sessions expire after 55 minutes (qBittorrent default is 1 hour)
const SESSION_TTL_MS = 55 * 60 * 1000;

export class QBittorrentClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "QBittorrentClientError";
  }
}

/**
 * Get qBittorrent service configuration for a user
 */
export async function getQBittorrentConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({
    userId,
    serviceName: SERVICE_NAME,
  });
}

/**
 * Parse credentials from apiKey field (format: "username:password")
 */
function parseCredentials(apiKey: string): {
  username: string;
  password: string;
} {
  const colonIndex = apiKey.indexOf(":");
  if (colonIndex === -1) {
    throw new QBittorrentClientError(
      "Invalid qBittorrent credentials format. Expected 'username:password'."
    );
  }
  return {
    username: apiKey.substring(0, colonIndex),
    password: apiKey.substring(colonIndex + 1),
  };
}

/**
 * Authenticate with qBittorrent and get a session ID
 */
async function login(
  baseUrl: string,
  username: string,
  password: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/v2/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username, password }),
  });

  const text = await response.text();

  if (response.status === 403) {
    throw new QBittorrentClientError(
      "qBittorrent IP banned due to too many failed login attempts. Please wait or restart qBittorrent.",
      403
    );
  }

  if (text !== "Ok.") {
    throw new QBittorrentClientError(
      "qBittorrent authentication failed. Please check your username and password.",
      401
    );
  }

  // Extract SID from Set-Cookie header
  const cookie = response.headers.get("set-cookie");
  if (!cookie) {
    throw new QBittorrentClientError(
      "qBittorrent did not return a session cookie."
    );
  }

  const match = cookie.match(/SID=([^;]+)/);
  if (!match) {
    throw new QBittorrentClientError(
      "Could not parse session ID from qBittorrent response."
    );
  }

  return match[1];
}

/**
 * Get a valid session ID, either from cache or by logging in
 */
async function getSessionId(
  baseUrl: string,
  username: string,
  password: string
): Promise<string> {
  const cached = sessionCache.get(baseUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.sid;
  }

  const sid = await login(baseUrl, username, password);
  sessionCache.set(baseUrl, {
    sid,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return sid;
}

/**
 * Invalidate cached session for a baseUrl (used when session expires)
 */
function invalidateSession(baseUrl: string): void {
  sessionCache.delete(baseUrl);
}

/**
 * Make an authenticated request to the qBittorrent API
 */
export async function qbittorrentRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getQBittorrentConfig(userId);

  if (!config) {
    throw new QBittorrentClientError(
      "qBittorrent is not configured. Please configure qBittorrent in settings."
    );
  }

  if (!config.isEnabled) {
    throw new QBittorrentClientError(
      "qBittorrent is disabled. Please enable it in settings."
    );
  }

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const { username, password } = parseCredentials(config.apiKey);

  let sid = await getSessionId(baseUrl, username, password);
  const url = `${baseUrl}/api/v2${endpoint}`;

  const makeRequest = async (sessionId: string): Promise<Response> => {
    const headers: HeadersInit = {
      Cookie: `SID=${sessionId}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(sid);

  // If unauthorized, try to re-authenticate once
  if (response.status === 401) {
    invalidateSession(baseUrl);
    sid = await getSessionId(baseUrl, username, password);
    response = await makeRequest(sid);
  }

  if (!response.ok) {
    let errorMessage = `qBittorrent API error: ${response.status} ${response.statusText}`;

    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    } catch {
      // Ignore parsing errors
    }

    throw new QBittorrentClientError(errorMessage, response.status);
  }

  // Handle empty responses (some endpoints return empty body on success)
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (text === "" || text === "Ok.") {
    return {} as T;
  }

  // Try to parse as JSON anyway (some endpoints don't set content-type)
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/**
 * Helper to make POST requests with form data
 */
export async function qbittorrentPostForm(
  userId: string,
  endpoint: string,
  data: Record<string, string>
): Promise<void> {
  await qbittorrentRequest<void>(userId, endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(data),
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format ETA seconds to human-readable string
 */
export function formatEta(seconds: number): string {
  // 8640000 is qBittorrent's "infinity" value
  if (seconds >= 8_640_000) {
    return "Unknown";
  }
  if (seconds <= 0) {
    return "Done";
  }

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get human-readable state description
 */
export function getStateDescription(state: string): string {
  const stateDescriptions: Record<string, string> = {
    error: "Error",
    missingFiles: "Missing Files",
    uploading: "Uploading",
    pausedUP: "Paused (Seeding)",
    queuedUP: "Queued (Seeding)",
    stalledUP: "Stalled (Seeding)",
    checkingUP: "Checking",
    forcedUP: "Forced Seeding",
    allocating: "Allocating",
    downloading: "Downloading",
    metaDL: "Fetching Metadata",
    pausedDL: "Paused",
    queuedDL: "Queued",
    stalledDL: "Stalled",
    checkingDL: "Checking",
    forcedDL: "Forced Download",
    checkingResumeData: "Checking Resume Data",
    moving: "Moving",
    unknown: "Unknown",
  };

  return stateDescriptions[state] ?? state;
}
