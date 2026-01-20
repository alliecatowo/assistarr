"use client";

import type { ComponentProps, ReactNode } from "react";
import { Streamdown } from "streamdown";
import { InlineMediaLink } from "@/components/inline-media-link";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Pattern: [[Title|tmdbId]] or [[Title|tmdbId|mediaType]]
// Note: Use non-global for .test(), create new global instance for .exec() loop
const INLINE_MEDIA_PATTERN_SOURCE = /\[\[([^|\]]+)\|(\d+)(?:\|(movie|tv))?\]\]/;

// Pattern to strip ** bold markers around media links (AI sometimes wraps links in bold)
const BOLD_MEDIA_LINK_PATTERN = /\*\*(\[\[[^\]]+\]\])\*\*/g;

/**
 * Strip ** bold markers from around media links
 * Converts **[[Title|123]]** to [[Title|123]]
 */
function stripBoldFromMediaLinks(text: string): string {
  return text.replace(BOLD_MEDIA_LINK_PATTERN, "$1");
}

/**
 * Check if text contains inline media links
 */
function hasInlineMediaLinks(text: string): boolean {
  return INLINE_MEDIA_PATTERN_SOURCE.test(text);
}

interface MediaPart {
  type: "media";
  content: string;
  tmdbId: string;
  mediaType: string;
}

interface TextPart {
  type: "text";
  content: string;
}

type Part = MediaPart | TextPart;

/**
 * Split a single line/paragraph by inline media links
 */
function splitLineByMediaLinks(text: string): Part[] {
  const parts: Part[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(INLINE_MEDIA_PATTERN_SOURCE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    // Add the media link info
    const [, title, tmdbId, mediaType] = match;
    parts.push({
      type: "media",
      content: title,
      tmdbId,
      mediaType: mediaType || "movie",
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Render a single paragraph that may contain inline media links
 */
function renderParagraphWithLinks(text: string, keyPrefix: string): ReactNode {
  if (!hasInlineMediaLinks(text)) {
    // No media links - just render the markdown
    return (
      <Streamdown className="inline [&>p]:inline [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {text}
      </Streamdown>
    );
  }

  const parts = splitLineByMediaLinks(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "media") {
          return (
            <InlineMediaLink
              key={`${keyPrefix}-media-${index}`}
              mediaType={part.mediaType as "movie" | "tv"}
              title={part.content}
              tmdbId={part.tmdbId}
            />
          );
        }
        // Render text through Streamdown for markdown processing
        return (
          <Streamdown
            className="inline [&>p]:inline [&>*]:inline [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            key={`${keyPrefix}-text-${index}`}
          >
            {part.content}
          </Streamdown>
        );
      })}
    </>
  );
}

/**
 * Render text with inline media links while preserving paragraph structure
 */
function renderWithMediaLinks(text: string, baseKey: string): ReactNode {
  // Split by double newlines (paragraphs) or single newlines with list items
  const paragraphs = text.split(/\n\n+/);

  if (paragraphs.length === 1 && !hasInlineMediaLinks(text)) {
    // Single paragraph without media links - render normally
    return (
      <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {text}
      </Streamdown>
    );
  }

  return (
    <div className="space-y-4 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {paragraphs.map((paragraph, pIndex) => {
        const trimmed = paragraph.trim();
        if (!trimmed) {
          return null;
        }

        // Check if this paragraph contains media links
        if (hasInlineMediaLinks(trimmed)) {
          // Check if it's a list (starts with - or *)
          const lines = trimmed.split(/\n/);
          const isList = lines.every(
            (line) => /^[\s]*[-*]\s/.test(line) || line.trim() === ""
          );

          if (isList) {
            return (
              <ul
                className="list-disc pl-6 space-y-1"
                key={`${baseKey}-p-${pIndex}`}
              >
                {lines
                  .filter((l) => l.trim())
                  .map((line, lIndex) => {
                    const content = line.replace(/^[\s]*[-*]\s/, "");
                    return (
                      <li key={`${baseKey}-p-${pIndex}-l-${lIndex}`}>
                        {renderParagraphWithLinks(
                          content,
                          `${baseKey}-p-${pIndex}-l-${lIndex}`
                        )}
                      </li>
                    );
                  })}
              </ul>
            );
          }

          // Use div instead of p to avoid hydration errors when Streamdown renders block elements
          return (
            <div key={`${baseKey}-p-${pIndex}`}>
              {renderParagraphWithLinks(trimmed, `${baseKey}-p-${pIndex}`)}
            </div>
          );
        }

        // No media links - render through Streamdown
        return (
          <Streamdown
            className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            key={`${baseKey}-p-${pIndex}`}
          >
            {trimmed}
          </Streamdown>
        );
      })}
    </div>
  );
}

export function Response({ className, children, ...props }: ResponseProps) {
  // Check if children is a string with inline media links
  if (typeof children === "string" && hasInlineMediaLinks(children)) {
    // Strip ** bold markers from around media links before processing
    const processedText = stripBoldFromMediaLinks(children);
    return (
      <div
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
          className
        )}
      >
        {renderWithMediaLinks(processedText, "response")}
      </div>
    );
  }

  // Default: render through Streamdown
  return (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      {...props}
    >
      {children}
    </Streamdown>
  );
}
