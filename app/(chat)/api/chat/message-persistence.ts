import { saveMessages, updateMessage } from "@/lib/db/queries/index";
import type { ChatMessage } from "@/lib/types";
import type { UserMessage } from "./schema";

export type PersistContext = {
  chatId: string;
  isToolApprovalFlow: boolean;
  originalMessages: ChatMessage[];
};

export type FinishedMessage = {
  id: string;
  role: string;
  parts: unknown[];
};

/**
 * Saves a user message to the database
 */
export async function saveUserMessage(
  chatId: string,
  message: UserMessage
): Promise<void> {
  if (message?.role !== "user") {
    return;
  }

  await saveMessages({
    messages: [
      {
        chatId,
        id: message.id,
        role: "user",
        parts: message.parts,
        attachments: [],
        createdAt: new Date(),
      },
    ],
  });
}

/**
 * Persists finished messages after stream completion
 * Handles both tool approval flows (update existing) and normal flows (save new)
 */
export async function persistMessages(
  finishedMessages: FinishedMessage[],
  context: PersistContext
): Promise<void> {
  const { chatId, isToolApprovalFlow, originalMessages } = context;

  if (isToolApprovalFlow) {
    for (const finishedMsg of finishedMessages) {
      const existingMsg = originalMessages.find((m) => m.id === finishedMsg.id);
      if (existingMsg) {
        await updateMessage({
          id: finishedMsg.id,
          parts: finishedMsg.parts,
        });
      } else {
        await saveMessages({
          messages: [
            {
              id: finishedMsg.id,
              role: finishedMsg.role,
              parts: finishedMsg.parts,
              createdAt: new Date(),
              attachments: [],
              chatId,
            },
          ],
        });
      }
    }
  } else if (finishedMessages.length > 0) {
    await saveMessages({
      messages: finishedMessages.map((currentMessage) => ({
        id: currentMessage.id,
        role: currentMessage.role,
        parts: currentMessage.parts,
        createdAt: new Date(),
        attachments: [],
        chatId,
      })),
    });
  }
}
