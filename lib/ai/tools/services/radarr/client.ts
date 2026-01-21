import { ApiKeyHeaderAuth, createServiceClient } from "../core";

// Re-export ServiceClientError as RadarrClientError for backward compatibility
// This allows existing code using `instanceof RadarrClientError` to work
export { ServiceClientError as RadarrClientError } from "../core";

/**
 * Radarr client using the unified service client factory.
 * Reduced from 83 lines to ~20 lines.
 */
const client = createServiceClient({
  serviceName: "radarr",
  displayName: "Radarr",
  apiVersion: "/api/v3",
  authStrategy: ApiKeyHeaderAuth("X-Api-Key"),
});

// Export the client functions with Radarr-specific names for backward compatibility
export const getRadarrConfig = client.getConfig;
export const radarrRequest = client.request;
