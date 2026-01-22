import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

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
    const redirectUrl = encodeURIComponent(request.url);

    const response = NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
    response.headers.set(RESPONSE_CORRELATION_HEADER, correlationId);
    return response;
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
