import { afterEach, vi } from "vitest";

// Mock the logger module globally for all tests
vi.mock("@/lib/logger", () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => mockLogger),
    level: "silent",
  };
  return {
    logger: mockLogger,
    createLogger: vi.fn(() => mockLogger),
    withCorrelationId: vi.fn(() => mockLogger),
  };
});

// Browser-specific setup (only when window is defined, i.e., jsdom environment)
if (typeof window !== "undefined") {
  // Import testing-library extensions for DOM assertions
  await import("@testing-library/jest-dom/vitest");

  // Import cleanup for React component tests
  const { cleanup } = await import("@testing-library/react");

  // Cleanup after each test case
  afterEach(() => {
    cleanup();
  });

  // Mock window.matchMedia for components using media queries
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
  }));
}
