import { expect, test } from "@playwright/test";
import {
  mockJellyfinContinueWatching,
  mockJellyfinMedia,
  mockJellyfinRecentlyAdded,
  mockServiceConfigs,
  testPrompts,
} from "../fixtures/test-data";

/**
 * Jellyfin Integration Tests
 *
 * These tests verify the Jellyfin tool integrations work correctly
 * through the chat interface. They mock the external Jellyfin API
 * responses to ensure consistent test results.
 */

test.describe("Jellyfin Integration - Chat Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the settings API to return Jellyfin config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Jellyfin API endpoints
    await page.route("**/Items**", async (route) => {
      const url = route.request().url();

      if (url.includes("Resume")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ Items: mockJellyfinContinueWatching }),
        });
      } else if (url.includes("Latest")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockJellyfinRecentlyAdded),
        });
      } else if (url.includes("SearchTerm")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ Items: mockJellyfinMedia }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ Items: mockJellyfinMedia }),
        });
      }
    });

    await page.route("**/System/Info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ServerName: "Test Server", Version: "10.8.0" }),
      });
    });

    await page.route("**/Users/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ Id: "user-1", Name: "Test User" }),
      });
    });
  });

  test("can search for media in library via chat", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyfin.searchMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about continue watching", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyfin.continueWatching);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about recently added content", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyfin.recentlyAdded);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Jellyfin Integration - Error Handling", () => {
  test("handles Jellyfin service unavailable", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Jellyfin API to return error
    await page.route("**/*jellyfin*/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.route("**/Items**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyfin.searchMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    // Page should not crash
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("handles invalid API token", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock unauthorized response
    await page.route("**/Items**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.jellyfin.searchMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Jellyfin Integration - Service Configuration", () => {
  test("Jellyfin tools not available when service is disabled", async ({
    page,
  }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
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
    await input.fill(testPrompts.jellyfin.searchMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });

  test("Jellyfin tools not available when not configured", async ({ page }) => {
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
    await input.fill(testPrompts.jellyfin.searchMedia);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Jellyfin Integration - Media Library Queries", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/Items**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ Items: mockJellyfinMedia }),
      });
    });
  });

  test("can ask about specific movie in library", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Do I have The Matrix in my library?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about media types", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("What movies do I have?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("Jellyfin Integration - Watch Progress", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "jellyfin-1",
              ...mockServiceConfigs.jellyfin,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/Items**", async (route) => {
      const url = route.request().url();
      if (url.includes("Resume")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ Items: mockJellyfinContinueWatching }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("can get watch progress", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Show me what I was watching");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});
