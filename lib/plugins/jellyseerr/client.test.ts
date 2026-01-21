import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { JellyseerrClient } from "./client";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("JellyseerrClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "jellyseerr",
    baseUrl: "http://jellyseerr:5055",
    apiKey: "seerr-key",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should append X-Api-Key to headers", async () => {
    class TestClient extends JellyseerrClient {
      public exposeGet(path: string) {
        return this.get(path);
      }
    }
    const client = new TestClient(mockConfig);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    });

    await client.exposeGet("/status");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://jellyseerr:5055/status",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Api-Key": "seerr-key",
        }),
      })
    );
  });
});
