import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import { ApiClient } from "./client";

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("ApiClient", () => {
  const mockConfig: ServiceConfig = {
    id: "test",
    userId: "user",
    serviceName: "test-service",
    baseUrl: "http://test-api.com",
    apiKey: "test-api-key",
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  class TestClient extends ApiClient {
    public exposeGet(path: string, params?: Record<string, any>) {
      return this.get(path, params);
    }
  }

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should construct correct URL", async () => {
    const client = new TestClient(mockConfig);
    const mockResponse = { success: true };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    await client.exposeGet("/test/endpoint");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-api.com/test/endpoint",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Api-Key": "test-api-key",
        }),
      })
    );
  });

  it("should append query parameters", async () => {
    const client = new TestClient(mockConfig);
    const mockResponse = { success: true };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    await client.exposeGet("/test", { foo: "bar", num: 123 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-api.com/test?foo=bar&num=123",
      expect.any(Object)
    );
  });

  it("should handle trailing slash in baseUrl", async () => {
    const configWithSlash = { ...mockConfig, baseUrl: "http://test-api.com/" };
    const client = new TestClient(configWithSlash);
    const mockResponse = { success: true };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    await client.exposeGet("/test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-api.com/test",
      expect.any(Object)
    );
  });

  it("should throw error on non-ok response", async () => {
    const client = new TestClient(mockConfig);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Resource not found",
    });

    await expect(client.exposeGet("/test")).rejects.toThrow(
      "GET /test failed: 404 Not Found"
    );
  });
});
