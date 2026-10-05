import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";
import { ChatSDKError } from "../../errors";
import { db } from "../db";
import { type User, user } from "../schema";
import { generateHashedPassword } from "../utils";

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db
      .select()
      .from(user)
      .where(sql`lower(${user.email}) = ${email.trim().toLowerCase()}`);
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db
      .insert(user)
      .values({ email: email.trim().toLowerCase(), password: hashedPassword });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

const UNUSABLE_PASSWORD = "!guest-no-password";

export async function createGuestUser() {
  // Digits only (matches guestRegex). Random suffix avoids same-millisecond
  // collisions.
  const email = `guest-${Date.now()}${randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0")}`;
  // Guests never sign in with a password; store an unusable (non-bcrypt) value
  // instead of burning ~100 ms of synchronous bcrypt per guest.
  const password = UNUSABLE_PASSWORD;

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}
