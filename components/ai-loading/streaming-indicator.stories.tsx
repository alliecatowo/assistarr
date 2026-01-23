import type { Story, StoryDefault } from "@ladle/react";
import { StreamingIndicator } from "./streaming-indicator";

export default {
  title: "AI Loading / StreamingIndicator",
} satisfies StoryDefault;

// Default streaming indicator
export const Default: Story = () => (
  <>
    <style>
      {`
        @keyframes streaming-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}
    </style>
    <StreamingIndicator />
  </>
);

// In text context
export const InTextContext: Story = () => (
  <>
    <style>
      {`
        @keyframes streaming-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}
    </style>
    <p className="text-sm">
      Thinking
      <StreamingIndicator />
    </p>
  </>
);

// Different colors
export const Colors: Story = () => (
  <>
    <style>
      {`
        @keyframes streaming-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}
    </style>
    <div className="space-y-4">
      <div className="text-foreground">
        Default
        <StreamingIndicator />
      </div>
      <div className="text-blue-500">
        Blue
        <StreamingIndicator />
      </div>
      <div className="text-green-500">
        Green
        <StreamingIndicator />
      </div>
      <div className="text-purple-500">
        Purple
        <StreamingIndicator />
      </div>
    </div>
  </>
);

// In message context
export const InMessageContext: Story = () => (
  <>
    <style>
      {`
        @keyframes streaming-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}
    </style>
    <div className="max-w-md space-y-4">
      <div className="p-4 rounded-lg bg-muted">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
            AI
          </div>
          <div className="flex-1">
            <p className="text-sm">
              Searching for "The Matrix" in your library
              <StreamingIndicator />
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);

// Loading states
export const LoadingStates: Story = () => (
  <>
    <style>
      {`
        @keyframes streaming-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}
    </style>
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connecting to Radarr
        <StreamingIndicator />
      </p>
      <p className="text-sm text-muted-foreground">
        Fetching library data
        <StreamingIndicator />
      </p>
      <p className="text-sm text-muted-foreground">
        Processing request
        <StreamingIndicator />
      </p>
    </div>
  </>
);
