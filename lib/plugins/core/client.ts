import type { ServiceConfig } from "@/lib/db/schema";

/**
 * Base API client with centralized API prefix configuration.
 *
 * Each service client extends this and sets its apiPrefix, e.g.:
 * - Radarr/Sonarr: "/api/v3"
 * - Jellyseerr: "/api/v1"
 * - Jellyfin: "" (no prefix)
 *
 * This allows endpoints to be defined as simple paths like "/movie"
 * and the client automatically prepends the correct API prefix.
 */
export class ApiClient {
  /**
   * API route prefix to prepend to all paths.
   * Override in subclass to set service-specific prefix.
   * Examples: "/api/v3" for Radarr/Sonarr, "/api/v1" for Jellyseerr
   */
  protected readonly apiPrefix: string = "";

  constructor(protected config: ServiceConfig) {}

  protected getHeaders(): Promise<HeadersInit> {
    // Basic API Key auth (customizable via subclass or config if needed)
    return Promise.resolve({
      "X-Api-Key": this.config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    });
  }

  /**
   * Build the full URL for a request.
   * If path already starts with the apiPrefix, use it as-is.
   * Otherwise, prepend the apiPrefix.
   */
  private getUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    // Strip trailing slashes and common API suffixes to ensure clean path appending
    const baseUrl = this.config.baseUrl
      .replace(/\/$/, "")
      .replace(/\/api\/v[0-9]+$/, "")
      .replace(/\/api$/, "");

    // Determine if we need to add the API prefix
    // Don't double-add if path already includes it
    let fullPath = path;
    if (this.apiPrefix && !path.startsWith(this.apiPrefix)) {
      fullPath = `${this.apiPrefix}${path}`;
    }

    const url = new URL(`${baseUrl}${fullPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.getUrl(path, params);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `GET ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    return this.handleJson<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(this.getUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `POST ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    return this.handleJson<T>(response);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(this.getUrl(path), {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `PUT ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    return this.handleJson<T>(response);
  }

  async delete<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(this.getUrl(path, params), {
      method: "DELETE",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `DELETE ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    return this.handleJson<T>(response);
  }

  private async handleJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (_) {
      // If parsing fails, throw a more helpful error with context
      const preview = text.slice(0, 200);
      throw new Error(
        `Failed to parse JSON response: ${preview}${
          text.length > 200 ? "..." : ""
        }`
      );
    }
  }
}
