import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";
import { getSonarrConfig, SonarrClientError, sonarrRequest } from "./client";

// Mock the database query
vi.mock("@/lib/db/queries", () => ({
  getServiceConfig: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Sonarr Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSonarrConfig", () => {
    it("returns config when Sonarr is configured", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      const result = await getSonarrConfig("user-123");

      expect(result).toEqual(mockConfig);
      expect(getServiceConfig).toHaveBeenCalledWith({
        userId: "user-123",
        serviceName: "sonarr",
      });
    });

    it("returns null when Sonarr is not configured", async () => {
      vi.mocked(getServiceConfig).mockResolvedValue(null);

      const result = await getSonarrConfig("user-123");

      expect(result).toBeNull();
    });
  });

  describe("sonarrRequest", () => {
    it("throws SonarrClientError when not configured", async () => {
      vi.mocked(getServiceConfig).mockResolvedValue(null);

      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        SonarrClientError
      );
      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        "Sonarr is not configured. Please configure Sonarr in settings."
      );
    });

    it("throws SonarrClientError when disabled", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        SonarrClientError
      );
      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        "Sonarr is disabled. Please enable it in settings."
      );
    });

    it("makes correct API calls with headers", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      const mockResponse = [{ id: 1, title: "Test Series" }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sonarrRequest("user-123", "/series");

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8989/api/v3/series",
        expect.objectContaining({
          headers: {
            "X-Api-Key": "test-api-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("passes through custom options", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await sonarrRequest("user-123", "/series", {
        method: "POST",
        body: JSON.stringify({ title: "New Series" }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8989/api/v3/series",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "New Series" }),
          headers: {
            "X-Api-Key": "test-api-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("handles API errors with error message from response", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Series not found" }),
      });

      await expect(sonarrRequest("user-123", "/series/999")).rejects.toThrow(
        SonarrClientError
      );
      await expect(sonarrRequest("user-123", "/series/999")).rejects.toThrow(
        "Series not found"
      );
    });

    it("handles API errors gracefully when JSON parsing fails", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        SonarrClientError
      );
      await expect(sonarrRequest("user-123", "/series")).rejects.toThrow(
        "Sonarr API error: 500 Internal Server Error"
      );
    });

    it("includes status code in SonarrClientError", async () => {
      const mockConfig: ServiceConfig = {
        id: "1",
        userId: "user-123",
        serviceName: "sonarr",
        baseUrl: "http://localhost:8989",
        apiKey: "test-api-key",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({}),
      });

      try {
        await sonarrRequest("user-123", "/series");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(SonarrClientError);
        expect((error as SonarrClientError).statusCode).toBe(401);
      }
    });
  });

  describe("SonarrClientError", () => {
    it("has correct name property", () => {
      const error = new SonarrClientError("Test error");
      expect(error.name).toBe("SonarrClientError");
    });

    it("stores status code when provided", () => {
      const error = new SonarrClientError("Test error", 404);
      expect(error.statusCode).toBe(404);
    });

    it("is an instance of Error", () => {
      const error = new SonarrClientError("Test error");
      expect(error).toBeInstanceOf(Error);
    });
  });
});
