import type {
	AssistantModelMessage,
	ToolModelMessage,
	UIMessage,
	UIMessagePart,
} from "ai";
import { type ClassValue, clsx } from "clsx";
import { formatISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { DBMessage, Document } from "@/lib/db/schema";
import { ChatSDKError, type ErrorCode } from "./errors";
import type { ChatMessage, ChatTools, CustomUIDataTypes } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Default timeout for client-side API requests (30 seconds) */
const DEFAULT_CLIENT_TIMEOUT_MS = 30000;

export interface FetchOptions extends RequestInit {
	/** Request timeout in milliseconds. Defaults to 30s. */
	timeout?: number;
}

/**
 * Creates an AbortController with a timeout.
 * Returns the controller and a cleanup function to clear the timeout.
 */
function createTimeoutController(timeoutMs: number): {
	controller: AbortController;
	cleanup: () => void;
} {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	return {
		controller,
		cleanup: () => clearTimeout(timeoutId),
	};
}

export const fetcher = async (url: string, options?: FetchOptions) => {
	const { timeout = DEFAULT_CLIENT_TIMEOUT_MS, ...init } = options ?? {};
	const { controller, cleanup } = createTimeoutController(timeout);

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal,
		});

		if (!response.ok) {
			const { code, cause } = await response.json();
			throw new ChatSDKError(code as ErrorCode, cause);
		}

		return response.json();
	} catch (error: unknown) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new ChatSDKError(
				"offline:chat",
				`Request timed out after ${timeout}ms`,
			);
		}
		throw error;
	} finally {
		cleanup();
	}
};

export async function fetchWithErrorHandlers(
	input: RequestInfo | URL,
	init?: FetchOptions,
) {
	const { timeout = DEFAULT_CLIENT_TIMEOUT_MS, ...restInit } = init ?? {};
	const { controller, cleanup } = createTimeoutController(timeout);

	try {
		const response = await fetch(input, {
			...restInit,
			signal: controller.signal,
		});

		if (!response.ok) {
			const { code, cause } = await response.json();
			throw new ChatSDKError(code as ErrorCode, cause);
		}

		return response;
	} catch (error: unknown) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new ChatSDKError(
				"offline:chat",
				`Request timed out after ${timeout}ms`,
			);
		}

		if (typeof navigator !== "undefined" && !navigator.onLine) {
			throw new ChatSDKError("offline:chat");
		}

		throw error;
	} finally {
		cleanup();
	}
}

export function getLocalStorage(key: string) {
	if (typeof window !== "undefined") {
		return JSON.parse(localStorage.getItem(key) || "[]");
	}
	return [];
}

export function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

type ResponseMessageWithoutId = ToolModelMessage | AssistantModelMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
	const userMessages = messages.filter((message) => message.role === "user");
	return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
	documents: Document[],
	index: number,
) {
	if (!documents) {
		return new Date();
	}
	if (index > documents.length) {
		return new Date();
	}

	return documents[index].createdAt;
}

export function getTrailingMessageId({
	messages,
}: {
	messages: ResponseMessage[];
}): string | null {
	const trailingMessage = messages.at(-1);

	if (!trailingMessage) {
		return null;
	}

	return trailingMessage.id;
}

export function sanitizeText(text: string) {
	return text.replace("<has_function_call>", "");
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
	return messages.map((message) => ({
		id: message.id,
		role: message.role as "user" | "assistant" | "system",
		parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
		metadata: {
			createdAt: formatISO(message.createdAt),
		},
	}));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => (part as { type: "text"; text: string }).text)
		.join("");
}

// =============================================================================
// TMDB Image URL Utilities
// =============================================================================

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const TMDB_IMAGE_SIZES = {
	poster: "w342",
	posterLarge: "w500",
	backdrop: "w1280",
	profile: "w185",
	still: "w300",
} as const;

/**
 * Constructs a full TMDB image URL from a path.
 * Handles relative paths (starting with /) and already-complete URLs.
 */
export function getTmdbImageUrl(
	path: string | null | undefined,
	size: keyof typeof TMDB_IMAGE_SIZES = "poster",
): string | null {
	if (!path) return null;

	// If already a full URL, return as-is
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	// If relative path (from TMDB API), construct full URL
	if (path.startsWith("/")) {
		return `${TMDB_IMAGE_BASE}/${TMDB_IMAGE_SIZES[size]}${path}`;
	}

	return null;
}

/** Convenience function for poster images (w342) */
export function getPosterUrl(path: string | null | undefined): string | null {
	return getTmdbImageUrl(path, "poster");
}

/** Convenience function for large poster images (w500) */
export function getPosterLargeUrl(
	path: string | null | undefined,
): string | null {
	return getTmdbImageUrl(path, "posterLarge");
}

/** Convenience function for backdrop images (w1280) */
export function getBackdropUrl(path: string | null | undefined): string | null {
	return getTmdbImageUrl(path, "backdrop");
}

/** Convenience function for profile/cast images (w185) */
export function getProfileUrl(path: string | null | undefined): string | null {
	return getTmdbImageUrl(path, "profile");
}

// =============================================================================
// Promise Utilities
// =============================================================================

/**
 * Extracts fulfilled and rejected results from Promise.allSettled output.
 * Use this when you need partial success - some promises can fail without
 * failing the entire operation.
 *
 * @example
 * const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
 * const { fulfilled, rejected } = getSettledResults(results);
 * console.log(`Got ${fulfilled.length} results, ${rejected.length} failed`);
 */
export function getSettledResults<T>(results: PromiseSettledResult<T>[]): {
	fulfilled: T[];
	rejected: { reason: unknown; index: number }[];
} {
	const fulfilled: T[] = [];
	const rejected: { reason: unknown; index: number }[] = [];

	results.forEach((result, index) => {
		if (result.status === "fulfilled") {
			fulfilled.push(result.value);
		} else {
			rejected.push({ reason: result.reason, index });
		}
	});

	return { fulfilled, rejected };
}

/**
 * Extracts only fulfilled values from Promise.allSettled output.
 * Convenience function when you only care about successful results.
 */
export function getFulfilledValues<T>(results: PromiseSettledResult<T>[]): T[] {
	return results
		.filter((r): r is PromiseFulfilledResult<T> => r.status === "fulfilled")
		.map((r) => r.value);
}
