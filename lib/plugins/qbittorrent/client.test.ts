import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { QBittorrentClient } from "./client";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("QBittorrentClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "qbittorrent",
    baseUrl: "http://qbit:8080",
    apiKey: "dummy-key", // qBit uses cookie auth but we pass something
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should make request with default headers", async () => {
    // Mock the actual request success
    const mockResponse: any[] = [];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    const client = new QBittorrentClient(mockConfig);
    await client.get("/test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://qbit:8080/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Api-Key": "dummy-key",
        }),
      })
    );
  });
});
