import { expect, test } from "@playwright/test";
import { mockServiceConfigs } from "../fixtures/test-data";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto("/settings");
  });

  test("settings page loads correctly", async ({ page }) => {
    // Check page title
    await expect(page.getByText("Media Service Settings")).toBeVisible();

    // Check description text
    await expect(
      page.getByText(/Configure your media services/i)
    ).toBeVisible();
  });

  test("all service cards are visible", async ({ page }) => {
    // Check all service cards are present
    await expect(page.getByText("Radarr")).toBeVisible();
    await expect(page.getByText("Sonarr")).toBeVisible();
    await expect(page.getByText("Jellyfin")).toBeVisible();
    await expect(page.getByText("Jellyseerr")).toBeVisible();

    // Check service descriptions
    await expect(
      page.getByText(/Movie collection manager/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/TV series collection manager/i).first()
    ).toBeVisible();
    await expect(page.getByText(/Free software media system/i)).toBeVisible();
    await expect(
      page.getByText(/Request management and media discovery/i)
    ).toBeVisible();
  });

  test("each service card has required form fields", async ({ page }) => {
    // Check Radarr card has URL and API Key inputs
    const radarrUrlInput = page.getByLabel("Base URL").first();
    await expect(radarrUrlInput).toBeVisible();

    const radarrApiKeyInput = page.getByLabel("API Key").first();
    await expect(radarrApiKeyInput).toBeVisible();
  });

  test("can enter and clear service configuration", async ({ page }) => {
    // Find the Radarr URL input
    const urlInput = page.locator("#radarr-url");
    const apiKeyInput = page.locator("#radarr-key");

    // Enter values
    await urlInput.fill(mockServiceConfigs.radarr.baseUrl);
    await apiKeyInput.fill(mockServiceConfigs.radarr.apiKey);

    // Verify values are entered
    await expect(urlInput).toHaveValue(mockServiceConfigs.radarr.baseUrl);
    await expect(apiKeyInput).toHaveValue(mockServiceConfigs.radarr.apiKey);

    // Clear values
    await urlInput.clear();
    await apiKeyInput.clear();

    // Verify values are cleared
    await expect(urlInput).toHaveValue("");
    await expect(apiKeyInput).toHaveValue("");
  });

  test("enabled toggle exists for each service", async ({ page }) => {
    // Check enabled toggles are present
    const radarrToggle = page.locator("#radarr-enabled");
    const sonarrToggle = page.locator("#sonarr-enabled");
    const jellyfinToggle = page.locator("#jellyfin-enabled");
    const jellyseerrToggle = page.locator("#jellyseerr-enabled");

    await expect(radarrToggle).toBeVisible();
    await expect(sonarrToggle).toBeVisible();
    await expect(jellyfinToggle).toBeVisible();
    await expect(jellyseerrToggle).toBeVisible();
  });

  test("save button is present for each service", async ({ page }) => {
    // Check save buttons exist
    const saveButtons = page.getByRole("button", { name: "Save" });
    await expect(saveButtons).toHaveCount(4);
  });

  test("remove button is present for each service", async ({ page }) => {
    // Check remove buttons exist
    const removeButtons = page.getByRole("button", { name: "Remove" });
    await expect(removeButtons).toHaveCount(4);
  });

  test("placeholder URLs are shown for each service", async ({ page }) => {
    // Check placeholders
    await expect(
      page.locator('input[placeholder="http://localhost:7878"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="http://localhost:8989"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="http://localhost:8096"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="http://localhost:5055"]')
    ).toBeVisible();
  });
});

test.describe("Settings Page - Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("shows error toast when saving without required fields", async ({
    page,
  }) => {
    // Try to save without filling required fields
    const saveButton = page.getByRole("button", { name: "Save" }).first();
    await saveButton.click();

    // Should show error toast
    await expect(
      page.getByText(/Base URL and API Key are required/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("save button is disabled when no changes are made", async ({ page }) => {
    // Save buttons should be disabled initially (no changes)
    const saveButton = page.getByRole("button", { name: "Save" }).first();
    await expect(saveButton).toBeDisabled();
  });

  test("save button enables when changes are made", async ({ page }) => {
    // Fill in some values
    const urlInput = page.locator("#radarr-url");
    await urlInput.fill("http://localhost:7878");

    const apiKeyInput = page.locator("#radarr-key");
    await apiKeyInput.fill("test-api-key");

    // Save button should now be enabled
    const saveButton = page.getByRole("button", { name: "Save" }).first();
    await expect(saveButton).toBeEnabled();
  });
});

test.describe("Settings Page - API Integration", () => {
  test("fetches existing configurations on load", async ({ page }) => {
    // Mock the settings API to return existing configs
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              serviceName: "radarr",
              baseUrl: "http://localhost:7878",
              apiKey: "existing-api-key",
              isEnabled: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/settings");

    // Wait for API call and check if values are populated
    const urlInput = page.locator("#radarr-url");
    await expect(urlInput).toHaveValue("http://localhost:7878", {
      timeout: 5000,
    });
  });

  test("saves configuration successfully", async ({ page }) => {
    // Mock the settings API
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "new-id",
            ...body,
          }),
        });
      } else if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/settings");

    // Fill in configuration
    const urlInput = page.locator("#radarr-url");
    const apiKeyInput = page.locator("#radarr-key");

    await urlInput.fill(mockServiceConfigs.radarr.baseUrl);
    await apiKeyInput.fill(mockServiceConfigs.radarr.apiKey);

    // Save
    const saveButton = page.getByRole("button", { name: "Save" }).first();
    await saveButton.click();

    // Check for success toast
    await expect(page.getByText(/Radarr configuration saved/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("handles save error gracefully", async ({ page }) => {
    // Mock the settings API to return an error
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      } else if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/settings");

    // Fill in configuration
    const urlInput = page.locator("#radarr-url");
    const apiKeyInput = page.locator("#radarr-key");

    await urlInput.fill(mockServiceConfigs.radarr.baseUrl);
    await apiKeyInput.fill(mockServiceConfigs.radarr.apiKey);

    // Save
    const saveButton = page.getByRole("button", { name: "Save" }).first();
    await saveButton.click();

    // Check for error toast
    await expect(
      page.getByText(/Failed to save Radarr configuration/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("can toggle service enabled state", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              serviceName: "radarr",
              baseUrl: "http://localhost:7878",
              apiKey: "test-key",
              isEnabled: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/settings");

    // Click the enabled toggle
    const radarrToggle = page.locator("#radarr-enabled");
    await radarrToggle.click();

    // Toggle state should change - button state changes
    await expect(radarrToggle).toHaveAttribute("data-state", "unchecked");
  });
});

test.describe("Settings Page - Remove Configuration", () => {
  test("remove button is disabled when no config exists", async ({ page }) => {
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

    await page.goto("/settings");

    // Remove button should be disabled
    const removeButton = page.getByRole("button", { name: "Remove" }).first();
    await expect(removeButton).toBeDisabled();
  });

  test("can remove existing configuration", async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              serviceName: "radarr",
              baseUrl: "http://localhost:7878",
              apiKey: "test-key",
              isEnabled: true,
            },
          ]),
        });
      } else if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/settings");

    // Wait for config to load
    await expect(page.locator("#radarr-url")).toHaveValue(
      "http://localhost:7878",
      { timeout: 5000 }
    );

    // Click remove
    const removeButton = page.getByRole("button", { name: "Remove" }).first();
    await removeButton.click();

    // Check for success toast
    await expect(page.getByText(/Radarr configuration removed/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
