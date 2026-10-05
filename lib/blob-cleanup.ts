import { del } from "@vercel/blob";
import { createLogger } from "@/lib/logger";
import { isAllowedFileUrl } from "@/lib/upload-validation";

const log = createLogger("blob-cleanup");

/** Uploaded-file URLs referenced by message parts (only our own blob host). */
export function collectFileUrls(messages: Array<{ parts: unknown }>): string[] {
  const urls = new Set<string>();
  for (const message of messages) {
    if (!Array.isArray(message.parts)) {
      continue;
    }
    for (const part of message.parts) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "file" &&
        typeof (part as { url?: unknown }).url === "string" &&
        isAllowedFileUrl((part as { url: string }).url)
      ) {
        urls.add((part as { url: string }).url);
      }
    }
  }
  return [...urls];
}

/** Best-effort delete; a failure must never block deleting the chat. */
export async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) {
    return;
  }
  try {
    await del(urls);
  } catch (error) {
    log.warn({ error, count: urls.length }, "Failed to delete chat blobs");
  }
}
