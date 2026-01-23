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
    apiKey: "dummy-key",
    username: "admin",
    password: "testpass",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should authenticate and make request with session cookie", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => "Ok.",
      headers: new Headers([["set-cookie", "SID=abc123; Path=/; HttpOnly"]]),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => "v5.0.0",
    });

    const client = new QBittorrentClient(mockConfig);
    const version = await client.getAppVersion();

    expect(version).toBe("v5.0.0");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should get torrents with session cookie", async () => {
    const mockTorrents = [{ id: 1, name: "test.torrent" }];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => "Ok.",
      headers: new Headers([["set-cookie", "SID=abc123; Path=/; HttpOnly"]]),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockTorrents),
      json: async () => mockTorrents,
    });

    const client = new QBittorrentClient(mockConfig);
    const torrents = await client.getTorrents();

    expect(torrents).toEqual(mockTorrents);
  });
});
