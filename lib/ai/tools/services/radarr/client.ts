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
    throw new RadarrClientError(
      "Radarr is disabled. Please enable it in settings."
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
    let errorMessage = `Radarr API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();

      // Handle different error response formats from Radarr
      if (Array.isArray(errorData) && errorData.length > 0) {
        // Validation errors: [{ propertyName, errorMessage, severity }]
        const validationErrors = errorData
          .filter((e: { errorMessage?: string }) => e.errorMessage)
          .map((e: { propertyName?: string; errorMessage: string }) =>
            e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage
          );
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join("; ");
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.errorMessage) {
        errorMessage = errorData.errorMessage;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new RadarrClientError(errorMessage, response.status);
  }

  return response.json();
}
