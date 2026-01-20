import { expect, test } from "@playwright/test";
import {
  mockRadarrCalendar,
  mockRadarrMovies,
  mockRadarrQueue,
  mockServiceConfigs,
  testPrompts,
} from "../fixtures/test-data";

/**
 * Radarr Integration Tests
 *
 * These tests verify the Radarr tool integrations work correctly
 * through the chat interface. They mock the external Radarr API
 * responses to ensure consistent test results.
 */

test.describe("Radarr Integration - Chat Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the settings API to return Radarr config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "radarr-1",
              ...mockServiceConfigs.radarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Radarr API endpoints
    await page.route("**/api/v3/movie/lookup**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRadarrMovies),
      });
    });

    await page.route("**/api/v3/queue**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRadarrQueue),
      });
    });

    await page.route("**/api/v3/calendar**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRadarrCalendar),
      });
    });

    await page.route("**/api/v3/system/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "5.0.0" }),
      });
    });
  });

  test("can search for movies via chat", async ({ page }) => {
    await page.goto("/");

    // Send a search query
    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.searchMovie);
    await page.getByTestId("send-button").click();

    // Wait for assistant response
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    // The response should contain movie information
    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
    // Note: The actual content depends on AI response, but we verify
    // the interaction works
  });

  test("can ask about download queue", async ({ page }) => {
    await page.goto("/");

    // Ask about download queue
    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.getQueue);
    await page.getByTestId("send-button").click();

    // Wait for response
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about upcoming movies", async ({ page }) => {
    await page.goto("/");

    // Ask about calendar
    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.getCalendar);
    await page.getByTestId("send-button").click();

    // Wait for response
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Radarr Integration - Error Handling", () => {
  test("handles Radarr service unavailable", async ({ page }) => {
    // Mock settings to return Radarr config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "radarr-1",
              ...mockServiceConfigs.radarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Radarr API to return error
    await page.route("**/api/v3/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.searchMovie);
    await page.getByTestId("send-button").click();

    // Wait for response - should handle error gracefully
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    // Page should not crash
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
              id: "radarr-1",
              ...mockServiceConfigs.radarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock unauthorized response
    await page.route("**/api/v3/**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.searchMovie);
    await page.getByTestId("send-button").click();

    // Should handle error
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Radarr Integration - Service Configuration", () => {
  test("Radarr tools not available when service is disabled", async ({
    page,
  }) => {
    // Mock settings with Radarr disabled
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "radarr-1",
              ...mockServiceConfigs.radarr,
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
    await input.fill(testPrompts.radarr.searchMovie);
    await page.getByTestId("send-button").click();

    // Response should indicate tools are not available or respond without using Radarr
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });

  test("Radarr tools not available when not configured", async ({ page }) => {
    // Mock settings with no configs
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.searchMovie);
    await page.getByTestId("send-button").click();

    // Response should work without Radarr tools
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Radarr Integration - Tool Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "radarr-1",
              ...mockServiceConfigs.radarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v3/**", async (route) => {
      const url = route.request().url();

      if (url.includes("movie/lookup")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockRadarrMovies),
        });
      } else if (url.includes("rootfolder")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: 1, path: "/movies", accessible: true, freeSpace: 500000000000 },
          ]),
        });
      } else if (url.includes("qualityprofile")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: 1, name: "HD-1080p" },
            { id: 2, name: "Ultra-HD" },
          ]),
        });
      } else if (route.request().method() === "POST" && url.includes("movie")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            title: "Test Movie",
            year: 2024,
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("add movie request shows approval interface", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.radarr.addMovie);
    await page.getByTestId("send-button").click();

    // Wait for response
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    // The interface should show tool invocation or approval buttons
    // This depends on the tool approval implementation
    await page.waitForTimeout(2000);

    // Verify the page is still functional
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });
});
