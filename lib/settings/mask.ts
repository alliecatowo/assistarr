import type { ServiceConfig } from "@/lib/db/schema";

/**
 * Placeholder sent to the browser instead of a stored secret. Clients echo it
 * back unchanged to mean "keep the stored value" (see resolveSecret).
 */
export const SECRET_MASK = "••••••••";

export function isMaskedSecret(value: string | null | undefined): boolean {
  return value === SECRET_MASK;
}

/** Strip decrypted secrets from a service config before it leaves the server. */
export function maskServiceConfig(config: ServiceConfig): ServiceConfig {
  return {
    ...config,
    apiKey: config.apiKey ? SECRET_MASK : "",
    password: config.password ? SECRET_MASK : null,
  };
}

/**
 * Replace a masked placeholder from the client with the stored secret.
 * Any other value is a newly entered secret and is returned as is.
 */
export function resolveSecret(
  submitted: string,
  stored: string | null | undefined
): string {
  return isMaskedSecret(submitted) ? (stored ?? "") : submitted;
}
