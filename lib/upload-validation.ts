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
