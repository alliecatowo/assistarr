import type { ServiceConfig } from "@/lib/db/schema";

/**
 * Interface for authentication strategies.
 * Different services use different auth mechanisms.
 */
export interface AuthStrategy {
  /**
   * Apply authentication to request headers
   */
  applyAuth(headers: HeadersInit, config: ServiceConfig): HeadersInit;
}

/**
 * API key in a custom header (e.g., X-Api-Key for Radarr/Sonarr/Jellyseerr)
 */
export function ApiKeyHeaderAuth(headerName: string): AuthStrategy {
  return {
    applyAuth(headers: HeadersInit, config: ServiceConfig): HeadersInit {
      return {
        ...headers,
        [headerName]: config.apiKey,
      };
    },
  };
}

/**
 * Bearer token authentication with customizable template.
 * Default template: "Bearer {apiKey}"
 * Jellyfin uses: 'MediaBrowser Token="{apiKey}"'
 */
export function BearerTokenAuth(template = "Bearer {apiKey}"): AuthStrategy {
  return {
    applyAuth(headers: HeadersInit, config: ServiceConfig): HeadersInit {
      const authValue = template.replace("{apiKey}", config.apiKey);
      return {
        ...headers,
        Authorization: authValue,
      };
    },
  };
}

/**
 * Form-based login authentication (e.g., qBittorrent).
 * This strategy doesn't apply headers directly - it's handled
 * by the session management in the qBittorrent client.
 */
export const FormLoginAuth: AuthStrategy = {
  applyAuth(headers: HeadersInit, _config: ServiceConfig): HeadersInit {
    // Form login doesn't add auth headers - session cookies are managed separately
    return headers;
  },
};

/**
 * No authentication required
 */
export const NoAuth: AuthStrategy = {
  applyAuth(headers: HeadersInit, _config: ServiceConfig): HeadersInit {
    return headers;
  },
};
