import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerOTel } from "@vercel/otel";

/**
 * Get OpenTelemetry configuration based on environment
 *
 * Supports both Vercel deployment (uses Vercel's built-in OTLP endpoint)
 * and self-hosted Docker deployment (uses custom OTLP endpoint)
 */
function getOtelConfig() {
  const serviceName =
    process.env.OTEL_SERVICE_NAME ||
    process.env.VERCEL_GIT_REPO_SLUG ||
    "assistarr";
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = Boolean(process.env.VERCEL);

  // Configure sampling rate based on environment
  // Production: sample 10% of traces to reduce costs
  // Development: sample all traces for debugging
  const sampleRate = isProduction ? 0.1 : 1.0;

  const config: Parameters<typeof registerOTel>[0] = {
    serviceName,
    // Use parent-based sampling to respect incoming trace decisions
    // Falls back to ratio-based sampling for root spans
    traceIdRatioBasedSampler: sampleRate,
    // Enable W3C Trace Context propagation for distributed tracing
    // This enables request ID propagation across service boundaries
    propagators: [new W3CTraceContextPropagator()],
    attributes: {
      // Add deployment context to all traces
      "deployment.environment": process.env.NODE_ENV || "development",
      "service.version": process.env.VERCEL_GIT_COMMIT_SHA || "local",
    },
  };

  // Configure OTLP exporter for self-hosted deployments
  // Vercel automatically handles OTLP export, so we only configure
  // custom exporters for non-Vercel environments
  if (otlpEndpoint && !isVercel) {
    config.traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      // Headers can be configured via OTEL_EXPORTER_OTLP_HEADERS env var
      // e.g., "Authorization=Bearer token,X-Custom-Header=value"
    });
  }

  return config;
}

export function register() {
  const otelConfig = getOtelConfig();
  registerOTel(otelConfig);

  // Initialize pino logger on server startup
  // This ensures the logger is ready before any requests
  if (process.env.NODE_ENV !== "test") {
    import("@/lib/logger").then(({ logger }) => {
      logger.info(
        {
          env: process.env.NODE_ENV,
          otelServiceName: otelConfig.serviceName,
          otelEndpoint:
            process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "vercel-default",
        },
        "Server started - pino logger and OpenTelemetry initialized"
      );
    });
  }
}
