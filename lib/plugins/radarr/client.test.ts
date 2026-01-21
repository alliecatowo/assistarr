import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { RadarrClient } from "./client";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("RadarrClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "radarr",
    baseUrl: "http://radarr:7878",
    apiKey: "radarr-key",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should fetch system status", async () => {
    const client = new RadarrClient(mockConfig);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ version: "1.0.0" }),
    });

    const status = await client.getSystemStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://radarr:7878/api/v3/system/status",
      expect.any(Object)
    );
    expect(status).toEqual({ version: "1.0.0" });
  });
});
