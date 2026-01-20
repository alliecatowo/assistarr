import { expect, test } from "@playwright/test";
import {
  mockQBittorrentTorrents,
  mockQBittorrentTransferInfo,
  mockServiceConfigs,
  testPrompts,
} from "../fixtures/test-data";

/**
 * qBittorrent Integration Tests
 *
 * These tests verify the qBittorrent tool integrations work correctly
 * through the chat interface. They mock the external qBittorrent API
 * responses to ensure consistent test results.
 */

test.describe("qBittorrent Integration - Chat Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the settings API to return qBittorrent config
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock qBittorrent API endpoints
    await page.route("**/api/v2/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Ok.",
        headers: {
          "Set-Cookie": "SID=test-session-id; path=/",
        },
      });
    });

    await page.route("**/api/v2/torrents/info**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockQBittorrentTorrents),
      });
    });

    await page.route("**/api/v2/transfer/info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockQBittorrentTransferInfo),
      });
    });

    await page.route("**/api/v2/torrents/pause", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });

    await page.route("**/api/v2/torrents/resume", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });
  });

  test("can ask about active torrents via chat", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about download speeds", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.qbittorrent.getTransferInfo);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("qBittorrent Integration - Error Handling", () => {
  test("handles qBittorrent service unavailable", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock qBittorrent API to return error
    await page.route("**/api/v2/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("handles authentication failure", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v2/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Fails.", // qBittorrent returns "Fails." on auth failure
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });

  test("handles connection timeout", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v2/**", async (route) => {
      await route.abort("timedout");
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("qBittorrent Integration - Service Configuration", () => {
  test("qBittorrent tools not available when service is disabled", async ({
    page,
  }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
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
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });

  test("qBittorrent tools not available when not configured", async ({
    page,
  }) => {
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
    await input.fill(testPrompts.qbittorrent.getTorrents);
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("qBittorrent Integration - Torrent Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v2/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Ok.",
      });
    });

    await page.route("**/api/v2/torrents/info**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockQBittorrentTorrents),
      });
    });

    await page.route("**/api/v2/torrents/pause", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });

    await page.route("**/api/v2/torrents/resume", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });
  });

  test("can ask about specific torrent status", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("What is the status of my Dune download?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can ask about download progress", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("How far along are my downloads?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("qBittorrent Integration - Transfer Statistics", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v2/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Ok.",
      });
    });

    await page.route("**/api/v2/transfer/info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockQBittorrentTransferInfo),
      });
    });
  });

  test("can get current transfer speeds", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("What are my current download and upload speeds?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });

  test("can check connection status", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Is my torrent client connected?");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe("qBittorrent Integration - Tool Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "qbittorrent-1",
              ...mockServiceConfigs.qbittorrent,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v2/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Ok.",
      });
    });

    await page.route("**/api/v2/torrents/info**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockQBittorrentTorrents),
      });
    });

    await page.route("**/api/v2/torrents/pause", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });

    await page.route("**/api/v2/torrents/resume", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "",
      });
    });
  });

  test("pause torrent request shows approval interface", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Pause all my downloads");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    await page.waitForTimeout(2000);
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("resume torrent request works", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("Resume all my downloads");
    await page.getByTestId("send-button").click();

    const assistantMessage = page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 60_000 });

    const content = await assistantMessage.textContent();
    expect(content).toBeTruthy();
  });
});
