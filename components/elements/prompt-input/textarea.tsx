"use client";

import type {
  ChangeEvent,
  ClipboardEventHandler,
  KeyboardEventHandler,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePromptInputAttachments } from "./context";

// ============================================================================
// Textarea Component
// ============================================================================

export type PromptInputTextareaProps = React.ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  disableAutoResize?: boolean;
  resizeOnNewLinesOnly?: boolean;
};

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = "What would you like to know?",
  minHeight = 48,
  maxHeight = 164,
  disableAutoResize = false,
  resizeOnNewLinesOnly = false,
  ...props
}: PromptInputTextareaProps) => {
  const attachments = usePromptInputAttachments();

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) {
        return;
      }
      if (e.shiftKey) {
        return;
      }

      e.preventDefault();

      const form = e.currentTarget.form;
      const submitButton = form?.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;
      if (submitButton?.disabled) {
        return;
      }

      form?.requestSubmit();
    }
  };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (!event.clipboardData) {
      return;
    }

    const items = event.clipboardData.items;
    const files: File[] = [];

    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      attachments.add(files);
      event.preventDefault();
    }
  };

  return (
    <Textarea
      className={cn(
        "bg-transparent dark:bg-transparent px-3 py-2 w-full shadow-none outline-hidden ring-0 border-none focus-visible:ring-0 resize-none",
        disableAutoResize
          ? "field-sizing-fixed"
          : resizeOnNewLinesOnly
            ? "field-sizing-fixed"
            : "field-sizing-content max-h-[6lh]",
        className
      )}
      name="message"
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      rows={1}
      style={{
        minHeight,
        maxHeight: maxHeight || "none",
        ...props.style,
      }}
      {...props}
    />
  );
};
