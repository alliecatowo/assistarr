const ITEM_ID = /^[0-9a-fA-F-]{32,36}$/;
const IMAGE_TYPES = new Set(["Primary", "Backdrop", "Thumb", "Logo", "Banner"]);
const MAX_WIDTH_LIMIT = 2000;

export const JELLYFIN_IMAGE_ROUTE = "/api/jellyfin/image";

/**
 * Same-origin URL for a Jellyfin image. The browser never sees the Jellyfin
 * base URL or API key; the route fetches the image server-side.
 */
export function getProxiedImageUrl(
  itemId: string,
  type = "Primary",
  maxWidth?: number
): string {
  const params = new URLSearchParams({ id: itemId, type });
  if (maxWidth) {
    params.set("maxWidth", String(maxWidth));
  }
  return `${JELLYFIN_IMAGE_ROUTE}?${params.toString()}`;
}

export interface ImageRequest {
  id: string;
  type: string;
  maxWidth?: number;
}

/** Validate query params; returns null for anything unexpected. */
export function parseImageRequest(
  params: URLSearchParams
): ImageRequest | null {
  const id = params.get("id") ?? "";
  const type = params.get("type") ?? "Primary";
  if (!ITEM_ID.test(id) || !IMAGE_TYPES.has(type)) {
    return null;
  }
  const rawWidth = params.get("maxWidth");
  if (rawWidth === null) {
    return { id, type };
  }
  const maxWidth = Number(rawWidth);
  if (
    !Number.isInteger(maxWidth) ||
    maxWidth < 1 ||
    maxWidth > MAX_WIDTH_LIMIT
  ) {
    return null;
  }
  return { id, type, maxWidth };
}
