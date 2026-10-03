import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getChatById: vi.fn(),
  getMessageById: vi.fn(),
  deleteAfter: vi.fn(),
  updateVis: vi.fn(),
}));

vi.mock("@/app/(auth)/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/ai/providers", () => ({ getTitleModel: vi.fn() }));
vi.mock("@/lib/db/queries/index", () => ({
  getChatById: mocks.getChatById,
  getMessageById: mocks.getMessageById,
  deleteMessagesByChatIdAfterTimestamp: mocks.deleteAfter,
  updateChatVisibilityById: mocks.updateVis,
}));

import { deleteTrailingMessages, updateChatVisibility } from "./actions";

describe("chat server actions authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getChatById.mockResolvedValue({ id: "c1", userId: "owner" });
    mocks.getMessageById.mockResolvedValue([
      { id: "m1", chatId: "c1", createdAt: new Date() },
    ]);
  });

  it("rejects unauthenticated callers", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(
      updateChatVisibility({ chatId: "c1", visibility: "public" })
    ).rejects.toThrow();
    await expect(deleteTrailingMessages({ id: "m1" })).rejects.toThrow();
    expect(mocks.updateVis).not.toHaveBeenCalled();
    expect(mocks.deleteAfter).not.toHaveBeenCalled();
  });

  it("rejects a user who does not own the chat", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "attacker" } });
    await expect(
      updateChatVisibility({ chatId: "c1", visibility: "public" })
    ).rejects.toThrow();
    await expect(deleteTrailingMessages({ id: "m1" })).rejects.toThrow();
    expect(mocks.updateVis).not.toHaveBeenCalled();
    expect(mocks.deleteAfter).not.toHaveBeenCalled();
  });

  it("handles an unknown message id without a TypeError", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner" } });
    mocks.getMessageById.mockResolvedValue([]);
    await expect(deleteTrailingMessages({ id: "nope" })).rejects.toThrow(
      /forbidden|chat/i
    );
  });

  it("allows the owner", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner" } });
    await updateChatVisibility({ chatId: "c1", visibility: "public" });
    await deleteTrailingMessages({ id: "m1" });
    expect(mocks.updateVis).toHaveBeenCalledOnce();
    expect(mocks.deleteAfter).toHaveBeenCalledOnce();
  });
});
