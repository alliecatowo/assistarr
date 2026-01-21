import type { ServiceConfig } from "@/lib/db/schema";

export class ApiClient {
  constructor(protected config: ServiceConfig) {}

  protected getHeaders(): Promise<HeadersInit> {
    // Basic API Key auth (customizable via subclass or config if needed)
    return Promise.resolve({
      "X-Api-Key": this.config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    });
  }

  private getUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = new URL(`${baseUrl}${path}`);

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
    const headers = await this.getHeaders();
    const response = await fetch(this.getUrl(path, params), {
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `GET ${path} failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
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

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
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

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
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

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}
