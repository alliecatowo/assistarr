import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";
import { isDemoMode } from "./lib/demo/mode";
import { GUEST_MARKER } from "./lib/shared-constants";

/**
 * Header names for correlation ID propagation
 * Supports multiple conventions for compatibility with various systems
 */
const CORRELATION_ID_HEADERS = [
  "x-request-id",
  "x-correlation-id",
  "traceparent",
] as const;
const RESPONSE_CORRELATION_HEADER = "x-correlation-id";
const PROBE_PATHS = new Set(["/api/health", "/api/ready"]);

/**
 * Extract existing correlation ID from request headers
 * Checks multiple common header names for compatibility
 */
function extractCorrelationId(request: NextRequest): string | null {
  for (const header of CORRELATION_ID_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      // For traceparent, extract the trace-id portion (second segment)
      if (header === "traceparent") {
        const parts = value.split("-");
        if (parts.length >= 2) {
          return parts[1];
        }
      }
      return value;
    }
  }
  return null;
}

/**
 * Generate a new correlation ID using crypto.randomUUID()
 */
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

function cookiesRequiredResponse(correlationId: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cookies required - Assistarr</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#222}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}}</style></head><body><h1>Cookies required</h1><p>Assistarr starts a temporary guest session using a cookie, but your browser or client did not keep it. Enable cookies for this site and <a href="/">try again</a>.</p></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      [RESPONSE_CORRELATION_HEADER]: correlationId,
    },
  });
}

function handleNoSession(request: NextRequest, correlationId: string) {
  // API clients without a session get a 401. Only page navigations are
  // bounced through guest creation, so scripts and crawlers hitting /api/*
  // can no longer mint a guest account (and quota) per request.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The guest route marks the URL it sends the browser back to. Seeing the
  // marker without a session means the client discards cookies (curl -L,
  // some crawlers, blocked cookies); stop instead of minting a guest per hop.
  if (request.nextUrl.searchParams.has(GUEST_MARKER)) {
    return cookiesRequiredResponse(correlationId);
  }

  const redirectUrl = encodeURIComponent(request.url);
  const response = NextResponse.redirect(
    new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
  );
  response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
  return response;
}

/** Drop the one-shot marker added by the guest route from the visible URL. */
function stripGuestMarker(request: NextRequest, correlationId: string) {
  if (
    !request.nextUrl.searchParams.has(GUEST_MARKER) ||
    request.method !== "GET"
  ) {
    return null;
  }
  const clean = request.nextUrl.clone();
  clean.searchParams.delete(GUEST_MARKER);
  const response = NextResponse.redirect(clean);
  response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate or extract correlation ID for request tracing
  const correlationId =
    extractCorrelationId(request) || generateCorrelationId();

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    const response = new Response("pong", { status: 200 });
    response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
    return response;
  }

  // Container/orchestrator probes carry no cookie and must not be redirected
  // or 401'd. Both routes expose pass/fail only (see their docs).
  if (PROBE_PATHS.has(pathname)) {
    const response = NextResponse.next();
    response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
    return response;
  }

  if (pathname.startsWith("/api/auth")) {
    const response = NextResponse.next({
      request: {
        headers: new Headers([
          ...request.headers.entries(),
          [RESPONSE_CORRELATION_HEADER, correlationId],
        ]),
      },
    });
    response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
    return response;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    return handleNoSession(request, correlationId);
  }

  const markerRedirect = stripGuestMarker(request, correlationId);
  if (markerRedirect) {
    return markerRedirect;
  }

  // Public demo: read-only settings, guest-only accounts.
  if (isDemoMode()) {
    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const blocked =
      (isWrite &&
        (pathname.startsWith("/api/settings") ||
          pathname.startsWith("/api/files") ||
          pathname === "/register" ||
          pathname === "/login")) ||
      pathname === "/register";
    if (blocked) {
      return NextResponse.json(
        { error: "Disabled in the public demo" },
        { status: 403 }
      );
    }
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
    return response;
  }

  // Add correlation ID to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(RESPONSE_CORRELATION_HEADER, correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add correlation ID to response headers for client visibility
  response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
