import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
const q = vi.hoisted(() => ({
  getChatById: vi.fn(),
  getMessageById: vi.fn(),
  getVotesByChatId: vi.fn(),
  voteMessage: vi.fn(),
}));
vi.mock("@/app/(auth)/auth", () => ({ auth }));
vi.mock("@/lib/db/queries/index", () => q);

import { PATCH } from "./route";

const patch = (body: unknown) =>
  PATCH(
    new Request("http://localhost/api/vote", {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  );

describe("PATCH /api/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "me" } });
    q.getChatById.mockResolvedValue({ id: "chat-1", userId: "me" });
  });

  it("votes on a message that belongs to the chat", async () => {
    q.getMessageById.mockResolvedValue([{ id: "m1", chatId: "chat-1" }]);
    const res = await patch({ chatId: "chat-1", messageId: "m1", type: "up" });
    expect(res.status).toBe(200);
    expect(q.voteMessage).toHaveBeenCalledOnce();
  });

  it("refuses a message id from someone else's chat", async () => {
    q.getMessageById.mockResolvedValue([{ id: "m9", chatId: "other-chat" }]);
    const res = await patch({ chatId: "chat-1", messageId: "m9", type: "up" });
    expect(res.status).toBe(404);
    expect(q.voteMessage).not.toHaveBeenCalled();
  });

  it("refuses an unknown message id", async () => {
    q.getMessageById.mockResolvedValue([]);
    const res = await patch({
      chatId: "chat-1",
      messageId: "nope",
      type: "up",
    });
    expect(res.status).toBe(404);
    expect(q.voteMessage).not.toHaveBeenCalled();
  });
});
