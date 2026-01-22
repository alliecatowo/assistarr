/**
 * Core Zod schemas for external API response validation.
 *
 * These schemas provide runtime validation for data coming from external APIs,
 * preventing untrusted data from being blindly trusted as typed objects.
 *
 * Pattern for gradual adoption:
 * 1. Define schemas that match existing TypeScript types
 * 2. Use .passthrough() on objects to allow extra fields (API may add new fields)
 * 3. Use .optional() liberally for fields that might not always be present
 * 4. Export both the schema and inferred type for type-safe usage
 */

import { z } from "zod";

// ============================================================================
// BASE SCHEMAS - Common patterns used across services
// ============================================================================

/**
 * Paginated response wrapper used by Arr services (Radarr/Sonarr)
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  recordSchema: T
) =>
  z
    .object({
      page: z.number(),
      pageSize: z.number(),
      sortKey: z.string(),
      sortDirection: z.enum(["ascending", "descending"]),
      totalRecords: z.number(),
      records: z.array(recordSchema),
    })
    .passthrough();

/**
 * Quality object used by Arr services
 */
export const ArrQualitySchema = z
  .object({
    quality: z
      .object({
        id: z.number(),
        name: z.string(),
        source: z.string().optional(),
        resolution: z.number().optional(),
        modifier: z.string().optional(),
      })
      .passthrough(),
    revision: z
      .object({
        version: z.number(),
        real: z.number(),
        isRepack: z.boolean(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ArrQuality = z.infer<typeof ArrQualitySchema>;

/**
 * Language object used by Arr services
 */
export const LanguageSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .passthrough();

export type Language = z.infer<typeof LanguageSchema>;

/**
 * Status message object used in queue items
 */
export const StatusMessageSchema = z
  .object({
    title: z.string(),
    messages: z.array(z.string()),
  })
  .passthrough();

export type StatusMessage = z.infer<typeof StatusMessageSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validation result type for explicit success/failure handling
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Safely validate data against a schema, returning a result object
 * instead of throwing. Useful when you want to handle validation
 * failures gracefully (e.g., logging and continuing with degraded data).
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate data against a schema, throwing on failure.
 * Use this when validation failure should be treated as an error.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate an array of items, filtering out invalid items and
 * returning both valid items and any validation errors.
 * Useful for processing API responses where some items might be malformed.
 */
export function validateArray<T>(
  schema: z.ZodType<T>,
  data: unknown[]
): { valid: T[]; errors: Array<{ index: number; error: z.ZodError }> } {
  const valid: T[] = [];
  const errors: Array<{ index: number; error: z.ZodError }> = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({ index: i, error: result.error });
    }
  }

  return { valid, errors };
}
