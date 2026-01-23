import { expect, test } from "@playwright/test";
import fetch from "sync-fetch";

// URL where Ladle is served
const LADLE_URL = process.env.LADLE_URL || "http://localhost:61000";

// Fetch Ladle's meta file containing all stories
let stories: Record<
  string,
  { meta?: { skip?: boolean; desktopOnly?: boolean } }
>;

try {
  const response = fetch(`${LADLE_URL}/meta.json`);
  stories = response.json().stories;
} catch {
  console.error(
    `Failed to fetch meta.json from ${LADLE_URL}. Make sure Ladle is running.`
  );
  stories = {};
}

// Configure viewport sizes for responsive testing
const viewports = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 375, height: 667 },
};

// biome-ignore lint/complexity/noForEach: forEach is appropriate for dynamic test generation
Object.keys(stories).forEach((storyKey) => {
  const story = stories[storyKey];

  test.describe(storyKey, () => {
    // Skip stories marked with meta.skip
    test.skip(story?.meta?.skip === true, "meta.skip is true");

    test("desktop snapshot", async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto(`${LADLE_URL}/?story=${storyKey}&mode=preview`);
      await page.waitForSelector("[data-storyloaded]");
      // Wait for animations to settle
      await page.waitForTimeout(100);
      await expect(page).toHaveScreenshot(`${storyKey}-desktop.png`);
    });

    // Only run mobile tests for components that are responsive
    if (!story?.meta?.desktopOnly) {
      test("mobile snapshot", async ({ page }) => {
        await page.setViewportSize(viewports.mobile);
        await page.goto(`${LADLE_URL}/?story=${storyKey}&mode=preview`);
        await page.waitForSelector("[data-storyloaded]");
        await page.waitForTimeout(100);
        await expect(page).toHaveScreenshot(`${storyKey}-mobile.png`);
      });
    }
  });
});
