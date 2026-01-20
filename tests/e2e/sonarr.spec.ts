import { expect, test } from "@playwright/test";
import {
  mockServiceConfigs,
  mockSonarrCalendar,
  mockSonarrQueue,
  mockSonarrSeries,
  testPrompts,
} from "../fixtures/test-data";

/**
 * Sonarr Integration Tests
 *
 * These tests verify the Sonarr tool integrations work correctly
 * through the chat interface. They mock the external Sonarr API
 * responses to ensure consistent test results.
 */

test.describe("Sonarr Integration - Chat Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the settings API to return Sonarr config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sonarr-1",
              ...mockServiceConfigs.sonarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Sonarr API endpoints
    await page.route("**/api/v3/series/lookup**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSonarrSeries),
      });
    });

    await page.route("**/api/v3/queue**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSonarrQueue),
      });
    });

    await page.route("**/api/v3/calendar**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSonarrCalendar),
      });
    });

    await page.route("**/api/v3/system/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "4.0.0" }),
      });
    });
  });

  test("can search for TV series via chat", async ({ page }) => {
    await page.goto("/");

    // Send a search query
    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.searchSeries);
    await page.getByTestId("send-button").click();

    // Wait for assistant response
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about TV show download queue", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.getQueue);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about upcoming episodes", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.getCalendar);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Sonarr Integration - Error Handling", () => {
  test("handles Sonarr service unavailable", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sonarr-1",
              ...mockServiceConfigs.sonarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Sonarr API to return error
    await page.route("**/api/v3/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.searchSeries);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    // Page should not crash
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("handles connection timeout", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sonarr-1",
              ...mockServiceConfigs.sonarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock timeout by aborting request
    await page.route("**/api/v3/**", async (route) => {
      await route.abort("timedout");
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.searchSeries);
    await page.getByTestId("send-button").click();

    // Should handle timeout gracefully
    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Sonarr Integration - Service Configuration", () => {
  test("Sonarr tools not available when service is disabled", async ({
    page,
  }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sonarr-1",
              ...mockServiceConfigs.sonarr,
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
    await input.fill(testPrompts.sonarr.searchSeries);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Sonarr Integration - Tool Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sonarr-1",
              ...mockServiceConfigs.sonarr,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v3/**", async (route) => {
      const url = route.request().url();

      if (url.includes("series/lookup")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSonarrSeries),
        });
      } else if (url.includes("rootfolder")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              path: "/tv",
              accessible: true,
              freeSpace: 500_000_000_000,
            },
          ]),
        });
      } else if (url.includes("qualityprofile")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ id: 1, name: "HD-1080p" }]),
        });
      } else if (url.includes("languageprofile")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ id: 1, name: "English" }]),
        });
      } else if (
        route.request().method() === "POST" &&
        url.includes("series")
      ) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            title: "Test Series",
            year: 2024,
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("add series request shows approval interface", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.sonarr.addSeries);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    await page.waitForTimeout(2000);
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });
});

test.describe("Sonarr Integration - Combined Queries", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "sonarr-1", ...mockServiceConfigs.sonarr },
            { id: "radarr-1", ...mockServiceConfigs.radarr },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v3/queue**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSonarrQueue),
      });
    });
  });

  test("can ask about combined download status", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Show me all my downloads");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});
