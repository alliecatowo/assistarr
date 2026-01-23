import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "@/components/ui/button";
import { CrossSmallIcon } from "@/components/ui/icons";
import { Loader } from "./loader";

export default {
  title: "Elements / PreviewAttachment",
} satisfies StoryDefault;

// Note: Using mock components to avoid Next.js Image dependency

// Image attachment
export const ImageAttachment: Story = () => (
  <div
    className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
    data-testid="input-attachment-preview"
  >
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
      IMG
    </div>
    <Button
      className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
      size="sm"
      variant="destructive"
    >
      <CrossSmallIcon size={8} />
    </Button>
    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
      photo.jpg
    </div>
  </div>
);

// File attachment
export const FileAttachment: Story = () => (
  <div
    className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
    data-testid="input-attachment-preview"
  >
    <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
      File
    </div>
    <Button
      className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
      size="sm"
      variant="destructive"
    >
      <CrossSmallIcon size={8} />
    </Button>
    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
      document.pdf
    </div>
  </div>
);

// Uploading state
export const Uploading: Story = () => (
  <div
    className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
    data-testid="input-attachment-preview"
  >
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
      IMG
    </div>
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/50"
      data-testid="input-attachment-loader"
    >
      <Loader size={16} />
    </div>
    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
      uploading.png
    </div>
  </div>
);

// Multiple attachments
export const MultipleAttachments: Story = () => (
  <div className="flex gap-2">
    <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 text-white text-xs">
        IMG
      </div>
      <Button
        className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
        size="sm"
        variant="destructive"
      >
        <CrossSmallIcon size={8} />
      </Button>
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        image1.jpg
      </div>
    </div>
    <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs">
        IMG
      </div>
      <Button
        className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
        size="sm"
        variant="destructive"
      >
        <CrossSmallIcon size={8} />
      </Button>
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        image2.png
      </div>
    </div>
    <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
      <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
        File
      </div>
      <Button
        className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
        size="sm"
        variant="destructive"
      >
        <CrossSmallIcon size={8} />
      </Button>
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        data.csv
      </div>
    </div>
  </div>
);

// In input context
export const InInputContext: Story = () => (
  <div className="max-w-md p-4 border rounded-lg space-y-2">
    <div className="flex gap-2">
      <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
          IMG
        </div>
        <Button
          className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
          size="sm"
          variant="destructive"
        >
          <CrossSmallIcon size={8} />
        </Button>
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
          screenshot.png
        </div>
      </div>
    </div>
    <input
      className="w-full px-3 py-2 border rounded-md text-sm"
      placeholder="Type a message..."
      type="text"
    />
  </div>
);

// Long filename
export const LongFilename: Story = () => (
  <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
    <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
      File
    </div>
    <Button
      className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
      size="sm"
      variant="destructive"
    >
      <CrossSmallIcon size={8} />
    </Button>
    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
      very-long-filename-that-should-truncate.pdf
    </div>
  </div>
);
