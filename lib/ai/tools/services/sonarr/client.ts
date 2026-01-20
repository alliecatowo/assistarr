import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";

export class SonarrClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "SonarrClientError";
  }
}

export async function getSonarrConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({ userId, serviceName: "sonarr" });
}

export async function sonarrRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getSonarrConfig(userId);

  if (!config) {
    throw new SonarrClientError(
      "Sonarr is not configured. Please configure Sonarr in settings."
    );
  }

  if (!config.isEnabled) {
    throw new SonarrClientError(
      "Sonarr is disabled. Please enable it in settings."
    );
  }

  const url = `${config.baseUrl}/api/v3${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Sonarr API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new SonarrClientError(errorMessage, response.status);
  }

  return response.json();
}
