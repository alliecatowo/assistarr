import { genSaltSync, hashSync } from "bcrypt-ts";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "./db";

// Re-export trackQuery for use in query modules
export { trackQuery } from "./db";

/**
 * Generate a bcrypt hash for a password.
 * Used for user registration and guest user creation.
 */
export function generateHashedPassword(password: string) {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

/**
 * Transaction type for use in functions that accept a transaction parameter.
 * This allows functions to participate in an existing transaction or create their own.
 */
export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * Database instance type (can be either the main db or a transaction)
 */
export type DbInstance = typeof db | Transaction;

/**
 * Execute a function within a database transaction.
 * If the function throws, the transaction will be rolled back automatically.
 *
 * @param fn - The function to execute within the transaction
 * @returns The result of the function
 *
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   await tx.insert(users).values({ name: "John" });
 *   await tx.insert(profiles).values({ userId: 1, bio: "Hello" });
 *   return { success: true };
 * });
 * ```
 */
export function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(fn);
}
