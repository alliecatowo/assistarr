import { and, desc, eq, gt, inArray, lt, or, type SQL } from "drizzle-orm";
import type { VisibilityType } from "@/components/elements/visibility-selector";
import { logger } from "@/lib/logger";
import { ChatSDKError } from "../../errors";
import { db } from "../db";
import { chat, message, stream, vote } from "../schema";
import { withTransaction } from "../utils";

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    logger.debug({ chatId: id, userId, title }, "Saving chat");
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    logger.error({ error: _error, chatId: id }, "Failed to save chat");
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    logger.info({ chatId: id }, "Deleting chat by id");
    return await withTransaction(async (tx) => {
      await tx.delete(vote).where(eq(vote.chatId, id));
      await tx.delete(message).where(eq(message.chatId, id));
      await tx.delete(stream).where(eq(stream.chatId, id));

      const [chatsDeleted] = await tx
        .delete(chat)
        .where(eq(chat.id, id))
        .returning();
      return chatsDeleted;
    });
  } catch (_error) {
    logger.error({ error: _error, chatId: id }, "Failed to delete chat by id");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    logger.info({ userId }, "Deleting all chats by user id");
    return await withTransaction(async (tx) => {
      const userChats = await tx
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.userId, userId));

      if (userChats.length === 0) {
        return { deletedCount: 0 };
      }

      const chatIds = userChats.map((c) => c.id);

      await tx.delete(vote).where(inArray(vote.chatId, chatIds));
      await tx.delete(message).where(inArray(message.chatId, chatIds));
      await tx.delete(stream).where(inArray(stream.chatId, chatIds));

      const deletedChats = await tx
        .delete(chat)
        .where(eq(chat.userId, userId))
        .returning();

      return { deletedCount: deletedChats.length };
    });
  } catch (_error) {
    logger.error(
      { error: _error, userId },
      "Failed to delete all chats by user id"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

/**
 * Cursor format for keyset pagination: "timestamp_id"
 * Example: "2024-01-15T10:30:00.000Z_550e8400-e29b-41d4-a716-446655440000"
 */
export type PaginationCursor = {
  timestamp: Date;
  id: string;
};

export function encodeCursor(timestamp: Date, id: string): string {
  return `${timestamp.toISOString()}_${id}`;
}

export function decodeCursor(cursor: string): PaginationCursor | null {
  const separatorIndex = cursor.lastIndexOf("_");
  if (separatorIndex === -1) {
    return null;
  }

  const timestampStr = cursor.substring(0, separatorIndex);
  const id = cursor.substring(separatorIndex + 1);

  const timestamp = new Date(timestampStr);
  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return { timestamp, id };
}

/**
 * Build keyset pagination condition using composite key (createdAt, id)
 * For descending order (newest first):
 * - "after" cursor: get items NEWER than cursor (createdAt > cursor OR (createdAt = cursor AND id > cursorId))
 * - "before" cursor: get items OLDER than cursor (createdAt < cursor OR (createdAt = cursor AND id < cursorId))
 */
function buildKeysetCondition(
  cursor: PaginationCursor,
  direction: "after" | "before"
): SQL {
  const { timestamp, id } = cursor;

  if (direction === "after") {
    // For "startingAfter": get items newer than cursor (going backwards in desc order)
    // biome-ignore lint/style/noNonNullAssertion: or() returns non-null when given valid arguments
    return or(
      gt(chat.createdAt, timestamp),
      and(eq(chat.createdAt, timestamp), gt(chat.id, id))
    )!;
  }
  // For "endingBefore": get items older than cursor (going forwards in desc order)
  // biome-ignore lint/style/noNonNullAssertion: or() returns non-null when given valid arguments
  return or(
    lt(chat.createdAt, timestamp),
    and(eq(chat.createdAt, timestamp), lt(chat.id, id))
  )!;
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    logger.debug(
      { userId: id, limit, startingAfter, endingBefore },
      "Fetching chats by user id"
    );
    const extendedLimit = limit + 1;

    // Build the WHERE conditions
    const conditions: SQL[] = [eq(chat.userId, id)];

    if (startingAfter) {
      const cursor = decodeCursor(startingAfter);
      if (!cursor) {
        throw new ChatSDKError(
          "bad_request:database",
          `Invalid cursor format: ${startingAfter}`
        );
      }
      conditions.push(buildKeysetCondition(cursor, "after"));
    } else if (endingBefore) {
      const cursor = decodeCursor(endingBefore);
      if (!cursor) {
        throw new ChatSDKError(
          "bad_request:database",
          `Invalid cursor format: ${endingBefore}`
        );
      }
      conditions.push(buildKeysetCondition(cursor, "before"));
    }

    // Single query with keyset pagination - no N+1!
    const filteredChats = await db
      .select()
      .from(chat)
      .where(and(...conditions))
      .orderBy(desc(chat.createdAt), desc(chat.id))
      .limit(extendedLimit);

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    logger.error({ error, userId: id }, "Failed to get chats by user id");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    logger.debug({ chatId: id }, "Fetching chat by id");
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      logger.debug({ chatId: id }, "Chat not found");
      return null;
    }

    return selectedChat;
  } catch (_error) {
    logger.error({ error: _error, chatId: id }, "Failed to get chat by id");
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    logger.debug({ chatId, visibility }, "Updating chat visibility");
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    logger.error(
      { error: _error, chatId, visibility },
      "Failed to update chat visibility by id"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    logger.error({ error, chatId }, "Failed to update chat title");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat title by id"
    );
  }
}
