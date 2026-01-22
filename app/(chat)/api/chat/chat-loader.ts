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
  message: ChatMessage | undefined,
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
 */
export function buildUIMessages(
  isToolApprovalFlow: boolean,
  messages: ChatMessage[] | undefined,
  messagesFromDb: DBMessage[],
  message: ChatMessage | undefined
): ChatMessage[] {
  if (isToolApprovalFlow) {
    return messages as ChatMessage[];
  }
  return [...convertToUIMessages(messagesFromDb), message as ChatMessage];
}
