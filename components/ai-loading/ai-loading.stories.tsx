import type { Story, StoryDefault } from "@ladle/react";
import { PlasmaOrb } from "./plasma-orb";
import { StreamingIndicator } from "./streaming-indicator";

export default {
  title: "AI / Loading",
} satisfies StoryDefault;

// Plasma Orb - default size
export const PlasmaOrbDefault: Story = () => (
  <div className="flex items-center justify-center p-8 bg-background">
    <PlasmaOrb />
  </div>
);

// Plasma Orb - various sizes
export const PlasmaOrbSizes: Story = () => (
  <div className="flex items-center justify-center gap-8 p-8 bg-background">
    <PlasmaOrb size={24} />
    <PlasmaOrb size={40} />
    <PlasmaOrb size={64} />
    <PlasmaOrb size={96} />
  </div>
);

// Plasma Orb - on dark background
export const PlasmaOrbDark: Story = () => (
  <div className="flex items-center justify-center p-8 bg-black rounded-lg">
    <PlasmaOrb size={80} />
  </div>
);

// Streaming Indicator - default
export const StreamingIndicatorDefault: Story = () => (
  <div className="flex items-center gap-2 p-4">
    <span>Thinking</span>
    <StreamingIndicator />
  </div>
);

// Streaming Indicator - in message context
export const StreamingIndicatorInContext: Story = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary" />
      <div className="flex items-center">
        <span className="text-muted-foreground">AI is typing</span>
        <StreamingIndicator />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-500" />
      <div className="flex items-center">
        <span>Searching your library</span>
        <StreamingIndicator />
      </div>
    </div>
  </div>
);

// Combined loading state
export const CombinedLoadingState: Story = () => (
  <div className="flex flex-col items-center gap-4 p-8 bg-background">
    <PlasmaOrb size={64} />
    <div className="flex items-center">
      <span className="text-sm text-muted-foreground">Processing request</span>
      <StreamingIndicator />
    </div>
  </div>
);

// Loading message simulation
export const LoadingMessageSimulation: Story = () => (
  <div className="max-w-md p-4 space-y-4 bg-background rounded-lg border">
    <div className="flex gap-3">
      <PlasmaOrb size={32} />
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-medium">Assistarr</span>
          <StreamingIndicator />
        </div>
        <p className="text-sm text-muted-foreground">
          Searching for "The Matrix" in your library...
        </p>
      </div>
    </div>
  </div>
);
