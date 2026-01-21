import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { SonarrClient } from "./client";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("SonarrClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "sonarr",
    baseUrl: "http://sonarr:8989",
    apiKey: "sonarr-key",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should fetch system status", async () => {
    const client = new SonarrClient(mockConfig);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ version: "3.0.0" }),
    });

    const status = await client.getSystemStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://sonarr:8989/api/v3/system/status",
      expect.any(Object)
    );
    expect(status).toEqual({ version: "3.0.0" });
  });
});
