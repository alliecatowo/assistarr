import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";
import { env } from "@/lib/env";
import { guestCreationAllowed } from "@/lib/guest-limit";
import { withGuestMarker } from "@/lib/shared-constants";

/** Same-origin only (no open redirect), tagged so the proxy can spot cookie-less loops. */
function safeRedirect(raw: string | null, requestUrl: string): string {
  const base = new URL(requestUrl);
  let target: URL;
  try {
    target = new URL(raw || "/", base);
  } catch {
    target = new URL("/", base);
  }
  if (target.origin !== base.origin) {
    target = new URL("/", base);
  }
  return withGuestMarker(`${target.pathname}${target.search}`, base.origin);
}

function tooManySessionsHtml(message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Please wait - Assistarr</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#222}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}}</style></head><body><h1>Please wait a moment</h1><p>${message}</p><p><a href="/">Try again</a></p></body></html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = safeRedirect(
    searchParams.get("redirectUrl"),
    request.url
  );

  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!(await guestCreationAllowed())) {
    const message =
      "Too many new sessions from this address. Try again in a little while.";
    if (request.headers.get("accept")?.includes("text/html")) {
      return new Response(tooManySessionsHtml(message), {
        status: 429,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "retry-after": "600",
          "cache-control": "no-store",
        },
      });
    }
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { "retry-after": "600" } }
    );
  }

  return signIn("guest", { redirect: true, redirectTo: redirectUrl });
}
