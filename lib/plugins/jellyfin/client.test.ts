import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { JellyfinClient } from "./client";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("JellyfinClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "jellyfin",
    baseUrl: "http://jellyfin:8096",
    apiKey: "jellyfin-token",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should use X-Emby-Token header", async () => {
    class TestJellyfinClient extends JellyfinClient {
      public exposeGet(path: string) {
        return this.get(path);
      }
    }
    const client = new TestJellyfinClient(mockConfig);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await client.exposeGet("/Items");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://jellyfin:8096/Items",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Emby-Token": "jellyfin-token",
        }),
      })
    );
  });
});
