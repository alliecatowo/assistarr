import { describe, it, expect, vi, beforeEach } from 'vitest';
import { radarrRequest, RadarrClientError, getRadarrConfig } from './client';
import { getServiceConfig } from '@/lib/db/queries';
import type { ServiceConfig } from '@/lib/db/schema';

// Mock the database query
vi.mock('@/lib/db/queries', () => ({
  getServiceConfig: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Radarr Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRadarrConfig', () => {
    it('returns config when Radarr is configured', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      const result = await getRadarrConfig('user-123');

      expect(result).toEqual(mockConfig);
      expect(getServiceConfig).toHaveBeenCalledWith({
        userId: 'user-123',
        serviceName: 'radarr',
      });
    });

    it('returns null when Radarr is not configured', async () => {
      vi.mocked(getServiceConfig).mockResolvedValue(null);

      const result = await getRadarrConfig('user-123');

      expect(result).toBeNull();
    });
  });

  describe('radarrRequest', () => {
    it('throws RadarrClientError when not configured', async () => {
      vi.mocked(getServiceConfig).mockResolvedValue(null);

      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        RadarrClientError
      );
      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        'Radarr is not configured. Please configure Radarr in settings.'
      );
    });

    it('throws RadarrClientError when disabled', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        RadarrClientError
      );
      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        'Radarr is disabled. Please enable it in settings.'
      );
    });

    it('makes correct API calls with headers', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      const mockResponse = [{ id: 1, title: 'Test Movie' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await radarrRequest('user-123', '/movie');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7878/api/v3/movie',
        expect.objectContaining({
          headers: {
            'X-Api-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('passes through custom options', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await radarrRequest('user-123', '/movie', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Movie' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7878/api/v3/movie',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'New Movie' }),
          headers: {
            'X-Api-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('handles API errors with error message from response', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Movie not found' }),
      });

      await expect(radarrRequest('user-123', '/movie/999')).rejects.toThrow(
        RadarrClientError
      );
      await expect(radarrRequest('user-123', '/movie/999')).rejects.toThrow(
        'Movie not found'
      );
    });

    it('handles API errors gracefully when JSON parsing fails', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        RadarrClientError
      );
      await expect(radarrRequest('user-123', '/movie')).rejects.toThrow(
        'Radarr API error: 500 Internal Server Error'
      );
    });

    it('includes status code in RadarrClientError', async () => {
      const mockConfig: ServiceConfig = {
        id: '1',
        userId: 'user-123',
        serviceName: 'radarr',
        baseUrl: 'http://localhost:7878',
        apiKey: 'test-api-key',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServiceConfig).mockResolvedValue(mockConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      try {
        await radarrRequest('user-123', '/movie');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RadarrClientError);
        expect((error as RadarrClientError).statusCode).toBe(401);
      }
    });
  });

  describe('RadarrClientError', () => {
    it('has correct name property', () => {
      const error = new RadarrClientError('Test error');
      expect(error.name).toBe('RadarrClientError');
    });

    it('stores status code when provided', () => {
      const error = new RadarrClientError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('is an instance of Error', () => {
      const error = new RadarrClientError('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
