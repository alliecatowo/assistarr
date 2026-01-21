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

  it("should handle login and return SID", async () => {
    // Mock login response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        "set-cookie": "SID=test-sid; path=/",
      }),
      text: async () => "Ok.",
    });

    const client = new QBittorrentClient(mockConfig);

    // Trigger a request that requires auth (which is any request in our client)
    // We simulate a successful login response from the constructor or first call?
    // Actually, ApiClient doesn't auto-login in constructor.
    // And QBittorrentClient overrides getHeaders to check for SID or login.

    // We can test getHeaders by making a request
    // Mock the actual request success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await client.get("/test");

    // First call should be to login
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://qbit:8080/api/v2/auth/login",
      expect.objectContaining({
        method: "POST",
        body: "username=&password=", // Default empty creds if not provided?
      })
    );

    // Second call should be the actual request with cookie
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://qbit:8080/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "SID=test-sid",
        }),
      })
    );
  });
});
