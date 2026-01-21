import { ApiClient } from "../core/client";

// In-memory session cache to avoid re-authenticating on every request.
const sessionCache = new Map<string, { sid: string; expiresAt: number }>();

// Sessions expire after 55 minutes (qBittorrent default is 1 hour)
const SESSION_TTL_MS = 55 * 60 * 1000;

export class QBittorrentClient extends ApiClient {
  getAppVersion() {
    return this.get<string>("/app/version");
  }

  async postForm(path: string, data: Record<string, string>) {
    // We need to implement form posting because standard post uses JSON body
    // We can reuse ApiClient.post if we manually handle headers and body, but
    // ApiClient.post does JSON.stringify(body) and sets Content-Type application/json hardcoded in getHeaders?
    // No, ApiClient.post calls this.getHeaders().
    // getHeaders returns Content-Type: application/json.
    // So we need to override headers for this call.

    // Actually ApiClient methods are simplistic.
    // Ideally ApiClient should allow overriding headers per request.
    // But it doesn't exposing options nicely.
    // However, I can use fetch directly using getUrl and getHeaders (if I expose them or similar).

    // Helper: get baseUrl from config, get SID, then fetch.
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const { username, password } = this.parseCredentials(this.config.apiKey);
    const sid = await this.getSessionId(baseUrl, username, password);

    const url = `${baseUrl}/api/v2${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Cookie: `SID=${sid}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(data),
    });

    if (!response.ok) {
      throw new Error(
        `POST ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    // qBittorrent returns "Ok." or empty or other text
    return text === "Ok." || text === "";
  }

  protected async getHeaders(): Promise<HeadersInit> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const { username, password } = this.parseCredentials(this.config.apiKey);
    const sid = await this.getSessionId(baseUrl, username, password);

    return {
      Cookie: `SID=${sid}`,
    };
  }

  private parseCredentials(apiKey: string): {
    username: string;
    password: string;
  } {
    const colonIndex = apiKey.indexOf(":");
    if (colonIndex === -1) {
      // Fallback or error? Assuming username:password format as per legacy code
      throw new Error(
        "Invalid qBittorrent credentials format. Expected 'username:password'."
      );
    }
    return {
      username: apiKey.substring(0, colonIndex),
      password: apiKey.substring(colonIndex + 1),
    };
  }

  private async getSessionId(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<string> {
    const cached = sessionCache.get(baseUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.sid;
    }

    const sid = await this.login(baseUrl, username, password);
    sessionCache.set(baseUrl, {
      sid,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return sid;
  }

  private async login(
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
      throw new Error(
        "qBittorrent IP banned due to too many failed login attempts."
      );
    }

    // Checking for both 200 OK and body content "Ok."
    // Some versions might be weird, but usually if status is not 200 it fails.
    // If status is 200 but text is not "Ok.", it is likely a failure page being returned as 200.
    // Simplifying logic: if not "Ok.", fail.
    if ((response.status !== 200 || text !== "Ok.") && text !== "Ok.") {
      throw new Error("qBittorrent authentication failed.");
    }

    // Extract SID from Set-Cookie header
    const cookie = response.headers.get("set-cookie");
    if (!cookie) {
      throw new Error("qBittorrent did not return a session cookie.");
    }

    const match = cookie.match(/SID=([^;]+)/);
    if (!match) {
      throw new Error("Could not parse session ID from qBittorrent response.");
    }

    return match[1];
  }

  override async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    try {
      return await super.get<T>(path, params);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        const baseUrl = this.config.baseUrl.replace(/\/$/, "");
        sessionCache.delete(baseUrl);
        return await super.get<T>(path, params);
      }
      throw error;
    }
  }
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
  // 864 = infinity
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
