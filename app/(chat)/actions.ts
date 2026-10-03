"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/elements/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries/index";
import { ChatSDKError } from "@/lib/errors";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text } = await generateText({
    model: getTitleModel(),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
  });
  return text
    .replace(/^[#*"\s]+/, "")
    .replace(/["]+$/, "")
    .trim();
}

async function requireOwnedChat(chatId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ChatSDKError("unauthorized:chat");
  }
  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== session.user.id) {
    // Same error for missing and foreign chats so ids cannot be probed.
    throw new ChatSDKError("forbidden:chat");
  }
  return chat;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });
  if (!message) {
    throw new ChatSDKError("forbidden:chat");
  }
  await requireOwnedChat(message.chatId);

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  if (visibility !== "public" && visibility !== "private") {
    throw new ChatSDKError("bad_request:api");
  }
  await requireOwnedChat(chatId);
  await updateChatVisibilityById({ chatId, visibility });
}
