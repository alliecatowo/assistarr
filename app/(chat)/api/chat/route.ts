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
import type { ChatMessage } from "@/lib/types";
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

    const { session, userAIConfig } = await validateSessionAndRateLimit();
    const isToolApprovalFlow = Boolean(messages);

    const { messagesFromDb, titlePromise } = await loadChatAndMessages(
      id,
      message as ChatMessage,
      isToolApprovalFlow,
      session.user.id,
      selectedVisibilityType
    );

    const uiMessages = buildUIMessages(
      isToolApprovalFlow,
      messages as ChatMessage[],
      messagesFromDb,
      message as ChatMessage
    );

    const geo = geolocation(request);
    const requestHints = buildRequestHints(geo);

    if (message?.role === "user") {
      await saveUserMessage(id, message as ChatMessage);
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
          /* ignore redis errors */
        }
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes("AI Gateway requires a valid credit card on file")
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });
  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
