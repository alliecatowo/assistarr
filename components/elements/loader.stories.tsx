import type { Story, StoryDefault } from "@ladle/react";
import { Loader } from "./loader";

export default {
  title: "Elements / Loader",
} satisfies StoryDefault;

// Default loader
export const Default: Story = () => <Loader />;

// Different sizes
export const Sizes: Story = () => (
  <div className="flex items-center gap-6">
    <div className="flex flex-col items-center gap-2">
      <Loader size={12} />
      <span className="text-xs text-muted-foreground">12px</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Loader size={16} />
      <span className="text-xs text-muted-foreground">16px</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Loader size={24} />
      <span className="text-xs text-muted-foreground">24px</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Loader size={32} />
      <span className="text-xs text-muted-foreground">32px</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Loader size={48} />
      <span className="text-xs text-muted-foreground">48px</span>
    </div>
  </div>
);

// With text
export const WithText: Story = () => (
  <div className="flex items-center gap-2">
    <Loader size={16} />
    <span className="text-sm">Loading...</span>
  </div>
);

// In button
export const InButton: Story = () => (
  <button
    type="button"
    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    disabled
  >
    <Loader size={16} />
    Processing
  </button>
);

// Colored loaders
export const Colored: Story = () => (
  <div className="flex items-center gap-6">
    <Loader size={24} className="text-blue-500" />
    <Loader size={24} className="text-green-500" />
    <Loader size={24} className="text-red-500" />
    <Loader size={24} className="text-yellow-500" />
    <Loader size={24} className="text-purple-500" />
  </div>
);

// Loading states
export const LoadingStates: Story = () => (
  <div className="space-y-4 max-w-sm">
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <span className="text-sm">Connecting to Radarr...</span>
      <Loader size={16} />
    </div>
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <span className="text-sm">Fetching library...</span>
      <Loader size={16} />
    </div>
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <span className="text-sm">Searching movies...</span>
      <Loader size={16} />
    </div>
  </div>
);

// Centered in container
export const Centered: Story = () => (
  <div className="flex h-[200px] items-center justify-center rounded-lg border">
    <div className="flex flex-col items-center gap-3">
      <Loader size={32} />
      <span className="text-sm text-muted-foreground">Loading content...</span>
    </div>
  </div>
);
