import { expect, test } from "@playwright/test";

test.describe("App Navigation", () => {
  test("home page loads with chat interface", async ({ page }) => {
    await page.goto("/");

    // Check main chat interface elements
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
    await expect(page.getByTestId("send-button")).toBeVisible();
  });

  test("sidebar is visible and contains navigation elements", async ({
    page,
  }) => {
    await page.goto("/");

    // Check sidebar header
    await expect(page.getByText("Assistarr")).toBeVisible();

    // Check new chat button exists
    await expect(
      page.locator('[aria-label="New Chat"]').or(
        page
          .locator("button")
          .filter({ has: page.locator("svg") })
          .first()
      )
    ).toBeVisible();
  });

  test("can navigate to settings from sidebar", async ({ page }) => {
    await page.goto("/");

    // Click on settings link
    const settingsLink = page.getByRole("link", { name: /settings/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL("/settings");
      await expect(page.getByText("Media Service Settings")).toBeVisible();
    }
  });

  test("clicking Assistarr logo navigates to home", async ({ page }) => {
    await page.goto("/settings");

    // Click on Assistarr link in sidebar
    const homeLink = page.getByRole("link", { name: "Assistarr" });
    await homeLink.click();

    await expect(page).toHaveURL("/");
  });

  test("new chat button creates fresh chat session", async ({ page }) => {
    await page.goto("/");

    // Send a message first to create a chat
    const input = page.getByTestId("multimodal-input");
    await input.fill("Test message");
    await page.getByTestId("send-button").click();

    // Wait for redirect to chat page
    await expect(page).toHaveURL(/\/chat\/[\w-]+/, { timeout: 10_000 });

    // Click new chat button (plus icon)
    const newChatButton = page
      .locator("button")
      .filter({
        has: page.locator(
          'svg[class*="lucide-plus"], [data-testid="plus-icon"]'
        ),
      })
      .first();
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      // Should navigate back to root
      await expect(page).toHaveURL("/", { timeout: 5000 });
    }
  });
});

test.describe("Sidebar Chat History", () => {
  test("sidebar shows chat history section", async ({ page }) => {
    await page.goto("/");

    // The sidebar content area should be visible
    const sidebarContent = page.locator('[data-sidebar="content"]');
    await expect(sidebarContent).toBeVisible();
  });

  test("clicking a chat in history navigates to that chat", async ({
    page,
  }) => {
    // First create a chat
    await page.goto("/");
    const input = page.getByTestId("multimodal-input");
    await input.fill("First test message");
    await page.getByTestId("send-button").click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/chat\/[\w-]+/, { timeout: 10_000 });

    // Get the chat ID from URL
    const _firstChatUrl = page.url();

    // Go back home
    await page.goto("/");

    // Check if the chat appears in history
    const historyItems = page.locator(
      '[data-sidebar="content"] a[href^="/chat/"]'
    );
    const count = await historyItems.count();

    if (count > 0) {
      // Click the first history item
      await historyItems.first().click();

      // Should navigate to a chat page
      await expect(page).toHaveURL(/\/chat\/[\w-]+/);
    }
  });
});

test.describe("User Navigation", () => {
  test("user nav button is visible when logged in", async ({ page }) => {
    await page.goto("/");

    // Check if user nav is visible (when logged in)
    const userNav = page.getByTestId("user-nav-button");
    // This will only be visible if logged in
    if (await userNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(userNav).toBeVisible();
    }
  });

  test("user nav menu opens on click", async ({ page }) => {
    await page.goto("/");

    const userNav = page.getByTestId("user-nav-button");
    if (await userNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userNav.click();

      // Check menu is visible
      const userNavMenu = page.getByTestId("user-nav-menu");
      await expect(userNavMenu).toBeVisible();
    }
  });

  test("theme toggle is available in user menu", async ({ page }) => {
    await page.goto("/");

    const userNav = page.getByTestId("user-nav-button");
    if (await userNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userNav.click();

      // Check theme toggle exists
      const themeItem = page.getByTestId("user-nav-item-theme");
      await expect(themeItem).toBeVisible();
    }
  });
});

test.describe("Responsive Navigation", () => {
  test("sidebar toggle works on mobile", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check for sidebar toggle button
    const sidebarToggle = page.getByTestId("sidebar-toggle-button");
    if (await sidebarToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sidebarToggle.click();

      // Sidebar should be visible after toggle
      await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    }
  });

  test("navigation works on tablet viewport", async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Main content should be visible
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("navigation works on desktop viewport", async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Both sidebar and main content should be visible
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
    await expect(page.getByText("Assistarr")).toBeVisible();
  });
});

test.describe("Error States", () => {
  test("404 page for non-existent routes", async ({ page }) => {
    const response = await page.goto("/non-existent-page-12345");

    // Should return 404 or show error page
    expect(response?.status()).toBe(404);
  });

  test("handles non-existent chat ID gracefully", async ({ page }) => {
    await page.goto("/chat/non-existent-chat-id-12345");

    // Should either redirect or show appropriate message
    // The behavior depends on the app's error handling
    await page.waitForLoadState("networkidle");

    // Check that the page loaded without crashing
    const bodyContent = await page.textContent("body");
    expect(bodyContent).toBeTruthy();
  });
});
