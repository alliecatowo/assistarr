import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { collectFileUrls, deleteBlobs } from "@/lib/blob-cleanup";
import {
  deleteAllChatsByUserId,
  getChatsByUserId,
  getMessagePartsByUserId,
} from "@/lib/db/queries/index";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const parsedLimit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 50)
    : 10;
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const fileUrls = collectFileUrls(
    await getMessagePartsByUserId({ userId: session.user.id })
  );
  const result = await deleteAllChatsByUserId({ userId: session.user.id });
  await deleteBlobs(fileUrls);

  return Response.json(result, { status: 200 });
}
