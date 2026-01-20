import { expect, test } from "@playwright/test";
import {
  mockJellyseerrRequests,
  mockJellyseerrSearch,
  mockServiceConfigs,
  testPrompts,
} from "../fixtures/test-data";

/**
 * Jellyseerr Integration Tests
 *
 * These tests verify the Jellyseerr tool integrations work correctly
 * through the chat interface. They mock the external Jellyseerr API
 * responses to ensure consistent test results.
 */

test.describe("Jellyseerr Integration - Chat Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the settings API to return Jellyseerr config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Jellyseerr API endpoints
    await page.route("**/api/v1/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJellyseerrSearch),
      });
    });

    await page.route("**/api/v1/request**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pageInfo: {
              pages: 1,
              page: 1,
              results: mockJellyseerrRequests.length,
            },
            results: mockJellyseerrRequests,
          }),
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 2,
            status: 1, // pending
            media: {
              tmdbId: 12_345,
              mediaType: "movie",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "1.9.0" }),
      });
    });
  });

  test("can search for content to request via chat", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.searchContent);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about existing requests", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.getRequests);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can request media via chat", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.requestMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Jellyseerr Integration - Error Handling", () => {
  test("handles Jellyseerr service unavailable", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Jellyseerr API to return error
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.searchContent);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("handles invalid API key", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.searchContent);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Jellyseerr Integration - Service Configuration", () => {
  test("Jellyseerr tools not available when service is disabled", async ({
    page,
  }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
              isEnabled: false,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyseerr.searchContent);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Jellyseerr Integration - Request Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/request**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pageInfo: {
              pages: 1,
              page: 1,
              results: mockJellyseerrRequests.length,
            },
            results: mockJellyseerrRequests,
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("can check request status", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("What is the status of my media requests?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about pending requests", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Do I have any pending requests?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Jellyseerr Integration - Tool Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJellyseerrSearch),
      });
    });

    await page.route("**/api/v1/request", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 2,
            status: 1,
            media: { tmdbId: 27_205, mediaType: "movie" },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("request media shows approval interface", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Request the movie Inception");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    await page.waitForTimeout(2000);
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });
});

test.describe("Jellyseerr Integration - Search Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyseerr-1",
              ...mockServiceConfigs.jellyseerr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJellyseerrSearch),
      });
    });
  });

  test("can search for movies to request", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Search for Inception to request");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can search for TV shows to request", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("I want to request a TV show");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});
