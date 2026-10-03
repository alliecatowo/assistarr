import {
  getChatById,
  getMessagesByChatId,
  saveChat,
} from "@/lib/db/queries/index";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import type { UserMessage } from "./schema";

export type ChatLoadResult = {
  messagesFromDb: DBMessage[];
  titlePromise: Promise<string> | null;
};

/**
 * Loads an existing chat or initializes a new one
 * @throws ChatSDKError if chat belongs to another user
 */
export async function loadChatAndMessages(
  id: string,
  message: UserMessage | undefined,
  isToolApprovalFlow: boolean,
  userId: string,
  visibility: "public" | "private"
): Promise<ChatLoadResult> {
  const chat = await getChatById({ id });
  let messagesFromDb: DBMessage[] = [];
  let titlePromise: Promise<string> | null = null;

  if (chat) {
    if (chat.userId !== userId) {
      throw new ChatSDKError("forbidden:chat");
    }
    messagesFromDb = await getMessagesByChatId({ id });
  } else if (isToolApprovalFlow) {
    // Approval responses only make sense on an existing, owned chat.
    throw new ChatSDKError("bad_request:api");
  } else if (message?.role === "user") {
    await saveChat({
      id,
      userId,
      title: "New chat",
      visibility,
    });
    titlePromise = generateTitleFromUserMessage({ message });
  }

  return { messagesFromDb, titlePromise };
}

/**
 * Builds the UI messages array from DB messages (plus the new user message).
 * Tool-approval requests are handled by buildApprovalHistory instead.
 * @throws Error if messages format is invalid
 */
export function buildUIMessages(
  messagesFromDb: DBMessage[],
  message: UserMessage | undefined
): ChatMessage[] {
  if (!message) {
    throw new Error(
      "Invalid message format: message is required for non-tool-approval flow"
    );
  }
  const userMessage: ChatMessage = {
    id: message.id,
    role: message.role,
    parts: message.parts,
  };
  return [...convertToUIMessages(messagesFromDb), userMessage];
}
