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
import type { Message, UserMessage } from "./schema";

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
    if (!isToolApprovalFlow) {
      messagesFromDb = await getMessagesByChatId({ id });
    }
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
 * Builds the UI messages array from DB messages or incoming messages
 * @throws Error if messages format is invalid
 */
export function buildUIMessages(
  isToolApprovalFlow: boolean,
  messages: Message[] | undefined,
  messagesFromDb: DBMessage[],
  message: UserMessage | undefined
): ChatMessage[] {
  if (isToolApprovalFlow) {
    if (!messages || !Array.isArray(messages)) {
      throw new Error(
        "Invalid messages format: expected array for tool approval flow"
      );
    }
    // Messages from tool approval flow are already validated by zod schema
    // and conform to the ChatMessage structure
    return messages as ChatMessage[];
  }
  if (!message) {
    throw new Error(
      "Invalid message format: message is required for non-tool-approval flow"
    );
  }
  // Convert user message to ChatMessage format
  const userMessage: ChatMessage = {
    id: message.id,
    role: message.role,
    parts: message.parts,
  };
  return [...convertToUIMessages(messagesFromDb), userMessage];
}
