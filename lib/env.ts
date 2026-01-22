import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("env");

/**
 * Server-side environment variable validation using Zod
 *
 * This module validates environment variables at application startup,
 * providing type-safe access and failing fast with clear error messages
 * for missing required variables.
 */

/**
 * Check if we're in a test environment (before parsing env)
 * This uses raw process.env to avoid circular dependency
 */
const isTestEnv = Boolean(
  process.env.VITEST ||
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

/**
 * Base schema for environment variables
 */
const baseEnvSchema = z.object({
  // Database (required in production, optional in test)
  POSTGRES_URL: isTestEnv
    ? z.string().default("postgres://test:test@localhost:5432/test")
    : z.string().min(1, "POSTGRES_URL is required"),

  // Authentication (required in production, optional in test)
  AUTH_SECRET: isTestEnv
    ? z.string().default("test-secret-at-least-32-characters-long")
    : z.string().min(1, "AUTH_SECRET is required"),

  // AI Providers (at least one required - validated below)
  OPENROUTER_API_KEY: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_PROVIDER: z
    .enum(["openrouter", "gateway"])
    .optional()
    .describe("AI provider to use (auto-detected if not specified)"),

  // Encryption key for credential encryption (optional - for future use)
  ENCRYPTION_KEY: z.string().optional(),

  // Redis for resumable streams (optional)
  REDIS_URL: z.string().optional(),

  // Vercel Blob storage (optional)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Sentry error tracking (optional)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Test environment variables
  PLAYWRIGHT_TEST_BASE_URL: z.string().optional(),
  PLAYWRIGHT: z.string().optional(),
  CI_PLAYWRIGHT: z.string().optional(),
  VITEST: z.string().optional(),
});

/**
 * Full schema with cross-field validation for AI providers
 */
const serverEnvSchema = baseEnvSchema.superRefine((data, ctx) => {
  // Skip AI provider validation in test environments
  if (isTestEnv) {
    return;
  }

  // Validate that at least one AI provider key is present
  const hasOpenRouter = Boolean(data.OPENROUTER_API_KEY);
  const hasGateway = Boolean(data.AI_GATEWAY_API_KEY);

  if (!hasOpenRouter && !hasGateway) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "At least one AI provider API key is required: OPENROUTER_API_KEY or AI_GATEWAY_API_KEY",
      path: ["OPENROUTER_API_KEY"],
    });
  }

  // Validate that explicit AI_PROVIDER has corresponding key
  if (data.AI_PROVIDER === "openrouter" && !hasOpenRouter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "AI_PROVIDER is set to 'openrouter' but OPENROUTER_API_KEY is not provided",
      path: ["OPENROUTER_API_KEY"],
    });
  }

  if (data.AI_PROVIDER === "gateway" && !hasGateway) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "AI_PROVIDER is set to 'gateway' but AI_GATEWAY_API_KEY is not provided",
      path: ["AI_GATEWAY_API_KEY"],
    });
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Format Zod validation errors for clear console output
 */
function formatEnvErrors(error: z.ZodError): string {
  const errors = error.errors.map((err) => {
    const path = err.path.length > 0 ? err.path.join(".") : "env";
    return `  - ${path}: ${err.message}`;
  });

  return [
    "",
    "Environment variable validation failed:",
    "",
    ...errors,
    "",
    "Please check your .env.local file and ensure all required variables are set.",
    "",
  ].join("\n");
}

/**
 * Parse and validate environment variables
 * Fails fast with clear error messages for missing required variables
 */
function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    log.error(formatEnvErrors(result.error));
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

/**
 * Validated and type-safe environment variables
 *
 * Import this instead of using process.env directly:
 * ```ts
 * import { env } from '@/lib/env';
 * const dbUrl = env.POSTGRES_URL;
 * ```
 */
export const env = validateEnv();

/**
 * Check if we're in a production environment
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if we're in a development environment
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if we're in a test environment
 */
export const isTest =
  env.NODE_ENV === "test" ||
  Boolean(env.PLAYWRIGHT_TEST_BASE_URL || env.PLAYWRIGHT || env.CI_PLAYWRIGHT);

/**
 * Get the configured AI provider
 * Returns the explicit setting or auto-detects based on available keys
 */
export function getAIProvider(): "openrouter" | "gateway" {
  if (env.AI_PROVIDER) {
    return env.AI_PROVIDER;
  }

  // Auto-detect based on available keys
  return env.OPENROUTER_API_KEY ? "openrouter" : "gateway";
}
