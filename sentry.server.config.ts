import { init } from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Debug mode in development
    debug: process.env.NODE_ENV === "development",

    // Spotlight for local debugging
    spotlight: process.env.NODE_ENV === "development",
  });
}
