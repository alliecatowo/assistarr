/**
 * Core service abstractions for DRY, maintainable tool implementations.
 *
 * This module provides:
 * - Unified error handling (ServiceClientError)
 * - Authentication strategies (ApiKeyHeaderAuth, BearerTokenAuth, etc.)
 * - Base client factory (createServiceClient)
 * - Error handling HOF for tools (withToolErrorHandling)
 * - Shared Zod schemas
 */

// Authentication strategies
export {
  ApiKeyHeaderAuth,
  type AuthStrategy,
  BearerTokenAuth,
  FormLoginAuth,
  NoAuth,
} from "./auth-strategies";
// Base client
export {
  createServiceClient,
  type ServiceClient,
  type ServiceClientConfig,
} from "./base-client";
// Error handling
export {
  isServiceClientError,
  ServiceClientError,
} from "./errors";
// Shared schemas
export {
  addMediaRequestSchema,
  type DisplayableMediaSchema,
  displayableMediaSchema,
  type ExternalIds,
  externalIdsSchema,
  type MediaStatus,
  type MediaType,
  mediaStatusSchema,
  mediaTypeSchema,
  type QualityProfile,
  qualityProfileSchema,
  type RootFolder,
  rootFolderSchema,
  searchQueryInputSchema,
  serviceIdInputSchema,
  tmdbIdInputSchema,
  tvdbIdInputSchema,
} from "./schemas";
// Tool error handling
export {
  formatToolError,
  isErrorResponse,
  withToolErrorHandling,
} from "./with-error-handling";
