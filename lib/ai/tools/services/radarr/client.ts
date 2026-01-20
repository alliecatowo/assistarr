import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";

export class RadarrClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "RadarrClientError";
  }
}

export async function getRadarrConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({ userId, serviceName: "radarr" });
}

export async function radarrRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getRadarrConfig(userId);

  if (!config) {
    throw new RadarrClientError(
      "Radarr is not configured. Please configure Radarr in settings."
    );
  }

  if (!config.isEnabled) {
    throw new RadarrClientError("Radarr is disabled. Please enable it in settings.");
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
    let errorMessage = `Radarr API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new RadarrClientError(errorMessage, response.status);
  }

  return response.json();
}
