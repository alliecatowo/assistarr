import { geolocation } from "@vercel/functions";
import { createUIMessageStreamResponse, generateId } from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getServiceConfigs,
} from "@/lib/db/queries/index";
import { env } from "@/lib/env";
import { ChatSDKError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { buildUIMessages, loadChatAndMessages } from "./chat-loader";
import { saveUserMessage } from "./message-persistence";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import {
  buildRequestHints,
  configsToMap,
  createChatStream,
} from "./stream-handler";
import { validateSessionAndRateLimit } from "./validation";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    logger.warn({ error: _ }, "Invalid request body");
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      debugMode,
      mode,
    } = requestBody;

    logger.info(
      { chatId: id, model: selectedChatModel, mode },
      "Chat request received"
    );

    const { session, userAIConfig } = await validateSessionAndRateLimit();
    const isToolApprovalFlow = Boolean(messages);

    const { messagesFromDb, titlePromise } = await loadChatAndMessages(
      id,
      message,
      isToolApprovalFlow,
      session.user.id,
      selectedVisibilityType
    );

    const uiMessages = buildUIMessages(
      isToolApprovalFlow,
      messages,
      messagesFromDb,
      message
    );

    const geo = geolocation(request);
    const requestHints = buildRequestHints(geo);

    if (message?.role === "user") {
      await saveUserMessage(id, message);
    }

    // Fetch configs for service tools
    const serviceConfigs = await getServiceConfigs({ userId: session.user.id });
    const configsMap = configsToMap(serviceConfigs);

    const stream = createChatStream({
      chatId: id,
      session,
      selectedChatModel,
      uiMessages,
      configsMap,
      requestHints,
      debugMode,
      mode,
      isToolApprovalFlow,
      titlePromise,
      userAIConfig,
    });

    logger.debug(
      { chatId: id, messageCount: uiMessages.length },
      "Creating chat stream"
    );

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          logger.warn(
            { error: _, chatId: id },
            "Failed to create resumable stream (redis error)"
          );
        }
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      logger.error({ error, chatId: requestBody?.id }, "Chat SDK error");
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes("AI Gateway requires a valid credit card on file")
    ) {
      logger.warn({ error: error.message }, "AI Gateway credit card required");
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    logger.error({ error, chatId: requestBody?.id }, "Unexpected chat error");
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    logger.warn("Delete chat request missing ID");
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    logger.warn({ chatId: id }, "Unauthorized delete chat attempt");
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });
  if (chat?.userId !== session.user.id) {
    logger.warn(
      { chatId: id, userId: session.user.id, chatUserId: chat?.userId },
      "Forbidden delete chat attempt"
    );
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  logger.info({ chatId: id, userId: session.user.id }, "Deleting chat");

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
