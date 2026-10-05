export type UploadImageType = "image/png" | "image/jpeg";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length &&
  signature.every((byte, index) => bytes[index] === byte);

/** Detect the real image type from magic bytes; never trust the client MIME. */
export function sniffImageType(bytes: Uint8Array): UploadImageType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return "image/png";
  }
  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return "image/jpeg";
  }
  return null;
}

const EXTENSIONS: Record<UploadImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

/**
 * Build a blob path from the sniffed type and a sanitized stem of the client
 * filename (letters, digits, dot, dash, underscore only; no path segments).
 */
export function safeUploadName(
  clientName: string | undefined,
  type: UploadImageType
): string {
  const base = (clientName ?? "").split(/[\\/]/).pop() ?? "";
  const stem = base
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${stem || "upload"}.${EXTENSIONS[type]}`;
}

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Chat file parts may only reference files this app uploaded: https, the
 * Vercel Blob public host, no embedded credentials, default port. Anything else
 * would let a client make the model provider fetch arbitrary (internal) URLs.
 */
export function isAllowedFileUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname.toLowerCase().endsWith(BLOB_HOST_SUFFIX) &&
    url.hostname.length > BLOB_HOST_SUFFIX.length &&
    !url.username &&
    !url.password &&
    (url.port === "" || url.port === "443")
  );
}
