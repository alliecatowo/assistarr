import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getChatById,
  getVotesByChatId,
  voteMessage,
} from "@/lib/db/queries/index";
import { ChatSDKError } from "@/lib/errors";

const voteSchema = z.object({
  chatId: z.string().min(1, "chatId is required"),
  messageId: z.string().min(1, "messageId is required"),
  type: z.enum(["up", "down"], {
    errorMap: () => ({ message: "type must be 'up' or 'down'" }),
  }),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter chatId is required."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:vote").toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError("forbidden:vote").toResponse();
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  let body: z.infer<typeof voteSchema>;

  try {
    const json = await request.json();
    body = voteSchema.parse(json);
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors.map((e) => e.message).join(", ")
        : "Invalid request body";
    return new ChatSDKError("bad_request:api", message).toResponse();
  }

  const { chatId, messageId, type } = body;

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:vote").toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:vote").toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError("forbidden:vote").toResponse();
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return new Response("Message voted", { status: 200 });
}
