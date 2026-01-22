import { init } from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Debug mode in development
    debug: process.env.NODE_ENV === "development",

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      "chrome-extension://",
      "moz-extension://",
      // Network errors
      "Failed to fetch",
      "NetworkError",
      "AbortError",
      // ResizeObserver errors (common in React apps)
      "ResizeObserver loop",
    ],
  });
}
