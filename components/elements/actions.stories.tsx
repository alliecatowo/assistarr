import type { Story, StoryDefault } from "@ladle/react";
import {
  CopyIcon,
  DownloadIcon,
  PencilEditIcon,
  ShareIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { Action, Actions } from "./actions";

export default {
  title: "Elements / Actions",
} satisfies StoryDefault;

// Default actions
export const Default: Story = () => (
  <Actions>
    <Action tooltip="Copy">
      <CopyIcon />
    </Action>
    <Action tooltip="Edit">
      <PencilEditIcon />
    </Action>
    <Action tooltip="Delete">
      <TrashIcon />
    </Action>
  </Actions>
);

// Message actions (assistant)
export const AssistantMessageActions: Story = () => (
  <Actions>
    <Action tooltip="Copy">
      <CopyIcon />
    </Action>
    <Action tooltip="Upvote Response">
      <ThumbUpIcon />
    </Action>
    <Action tooltip="Downvote Response">
      <ThumbDownIcon />
    </Action>
  </Actions>
);

// User message actions
export const UserMessageActions: Story = () => (
  <Actions className="justify-end">
    <Action tooltip="Edit">
      <PencilEditIcon />
    </Action>
    <Action tooltip="Copy">
      <CopyIcon />
    </Action>
  </Actions>
);

// Media actions
export const MediaActions: Story = () => (
  <Actions>
    <Action tooltip="Download">
      <DownloadIcon />
    </Action>
    <Action tooltip="Share">
      <ShareIcon />
    </Action>
    <Action tooltip="Delete">
      <TrashIcon />
    </Action>
  </Actions>
);

// With disabled action
export const WithDisabled: Story = () => (
  <Actions>
    <Action tooltip="Copy">
      <CopyIcon />
    </Action>
    <Action tooltip="Already upvoted" disabled>
      <ThumbUpIcon />
    </Action>
    <Action tooltip="Downvote Response">
      <ThumbDownIcon />
    </Action>
  </Actions>
);

// Single action
export const SingleAction: Story = () => (
  <Actions>
    <Action tooltip="Copy to clipboard">
      <CopyIcon />
    </Action>
  </Actions>
);

// Without tooltips
export const WithoutTooltips: Story = () => (
  <Actions>
    <Action label="Copy">
      <CopyIcon />
    </Action>
    <Action label="Edit">
      <PencilEditIcon />
    </Action>
    <Action label="Delete">
      <TrashIcon />
    </Action>
  </Actions>
);

// In context (message row)
export const InMessageContext: Story = () => (
  <div className="flex items-start gap-3 p-4 rounded-lg border max-w-md group">
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      AI
    </div>
    <div className="flex-1">
      <p className="text-sm">
        I found The Matrix (1999) in your library. It's available in 4K quality.
      </p>
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Actions>
          <Action tooltip="Copy">
            <CopyIcon />
          </Action>
          <Action tooltip="Upvote">
            <ThumbUpIcon />
          </Action>
          <Action tooltip="Downvote">
            <ThumbDownIcon />
          </Action>
        </Actions>
      </div>
    </div>
  </div>
);
