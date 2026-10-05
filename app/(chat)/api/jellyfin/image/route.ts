import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { safeFetch, UnsafeUrlError } from "@/lib/net/ssrf";
import { parseImageRequest } from "@/lib/plugins/jellyfin/image-proxy";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Authenticated image proxy for Jellyfin artwork. The API key is sent as a
 * header from the server, so it never appears in page HTML, browser history or
 * upstream access logs.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseImageRequest(new URL(request.url).searchParams);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid image request" },
      { status: 400 }
    );
  }

  const config = await getServiceConfig({
    userId: session.user.id,
    serviceName: "jellyfin",
  });
  if (!config?.isEnabled) {
    return NextResponse.json(
      { error: "Jellyfin not configured" },
      { status: 404 }
    );
  }

  const query = new URLSearchParams({ quality: "90" });
  if (parsed.maxWidth) {
    query.set("maxWidth", String(parsed.maxWidth));
  }
  const base = config.baseUrl.replace(/\/$/, "");

  try {
    const upstream = await safeFetch(
      `${base}/Items/${parsed.id}/Images/${parsed.type}?${query.toString()}`,
      {
        headers: { "X-Emby-Token": config.apiKey },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    );

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!(upstream.ok && contentType.startsWith("image/"))) {
      return NextResponse.json(
        { error: "Image not available" },
        { status: 404 }
      );
    }

    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 502 });
    }

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof UnsafeUrlError ? 400 : 502;
    return NextResponse.json({ error: "Image fetch failed" }, { status });
  }
}
