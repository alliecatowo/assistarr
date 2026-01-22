import { and, asc, count, eq, gte, inArray } from "drizzle-orm";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import { chat, type DBMessage, message, vote } from "../schema";
import { withTransaction } from "../utils";

const log = createLogger("db:message");

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    log.debug(
      { count: messages.length, chatId: messages[0]?.chatId },
      "Saving messages"
    );
    return await db.insert(message).values(messages);
  } catch (_error) {
    log.error({ error: _error }, "Failed to save messages");
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    log.debug({ messageId: id }, "Updating message");
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    log.error({ error: _error, messageId: id }, "Failed to update message");
    throw new ChatSDKError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    log.debug({ chatId: id }, "Fetching messages by chat id");
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    log.error(
      { error: _error, chatId: id },
      "Failed to get messages by chat id"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    log.debug({ chatId, messageId, type }, "Voting on message");
    return await withTransaction(async (tx) => {
      const [existingVote] = await tx
        .select()
        .from(vote)
        .where(and(eq(vote.messageId, messageId)));

      if (existingVote) {
        return await tx
          .update(vote)
          .set({ isUpvoted: type === "up" })
          .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
      }
      return await tx.insert(vote).values({
        chatId,
        messageId,
        isUpvoted: type === "up",
      });
    });
  } catch (_error) {
    log.error({ error: _error, chatId, messageId }, "Failed to vote message");
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    log.debug({ messageId: id }, "Fetching message by id");
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    log.error({ error: _error, messageId: id }, "Failed to get message by id");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await withTransaction(async (tx) => {
      const messagesToDelete = await tx
        .select({ id: message.id })
        .from(message)
        .where(
          and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
        );

      const messageIds = messagesToDelete.map(
        (currentMessage) => currentMessage.id
      );

      if (messageIds.length > 0) {
        await tx
          .delete(vote)
          .where(
            and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
          );

        return await tx
          .delete(message)
          .where(
            and(eq(message.chatId, chatId), inArray(message.id, messageIds))
          );
      }
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    log.debug(
      { userId: id, differenceInHours },
      "Fetching message count by user id"
    );
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    log.error(
      { error: _error, userId: id },
      "Failed to get message count by user id"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}
