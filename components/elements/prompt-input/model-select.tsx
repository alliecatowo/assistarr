"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import {
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
} from "./primitives";

// ============================================================================
// Model Select Components
// ============================================================================

export type PromptInputModelSelectProps = ComponentProps<
  typeof PromptInputSelect
>;
export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <PromptInputSelect {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof PromptInputSelectTrigger
>;
export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <PromptInputSelectTrigger
    className={cn(
      "h-auto px-2 py-1.5", // Added from original elements/prompt-input.tsx style
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof PromptInputSelectContent
>;
export const PromptInputModelSelectContent = (
  props: PromptInputModelSelectContentProps
) => <PromptInputSelectContent {...props} />;

export type PromptInputModelSelectItemProps = ComponentProps<
  typeof PromptInputSelectItem
>;
export const PromptInputModelSelectItem = (
  props: PromptInputModelSelectItemProps
) => <PromptInputSelectItem {...props} />;

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof PromptInputSelectValue
>;
export const PromptInputModelSelectValue = (
  props: PromptInputModelSelectValueProps
) => <PromptInputSelectValue {...props} />;
