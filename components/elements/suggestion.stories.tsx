import type { Story, StoryDefault } from "@ladle/react";
import { Film, Tv } from "lucide-react";
import { Suggestion, Suggestions } from "./suggestion";

export default {
  title: "Elements / Suggestion",
} satisfies StoryDefault;

// Single suggestion
export const Single: Story = () => (
  <Suggestion suggestion="Add The Matrix to my library" />
);

// Multiple suggestions
export const Multiple: Story = () => (
  <Suggestions>
    <Suggestion suggestion="What's downloading?" />
    <Suggestion suggestion="Show my library" />
    <Suggestion suggestion="Recommend something" />
    <Suggestion suggestion="Add a movie" />
  </Suggestions>
);

// Media suggestions
export const MediaSuggestions: Story = () => (
  <Suggestions>
    <Suggestion suggestion="Search for movies">
      <Film className="size-4 mr-1" />
      Movies
    </Suggestion>
    <Suggestion suggestion="Search for TV shows">
      <Tv className="size-4 mr-1" />
      TV Shows
    </Suggestion>
  </Suggestions>
);

// Chat suggestions
export const ChatSuggestions: Story = () => (
  <div className="space-y-2 max-w-lg">
    <p className="text-sm text-muted-foreground">Try asking:</p>
    <Suggestions>
      <Suggestion suggestion="What's new in my library?" />
      <Suggestion suggestion="Show download queue" />
      <Suggestion suggestion="Find sci-fi movies" />
    </Suggestions>
  </div>
);

// Different variants
export const Variants: Story = () => (
  <div className="space-y-4">
    <div>
      <p className="text-sm text-muted-foreground mb-2">Outline (default)</p>
      <Suggestion suggestion="Outline variant" variant="outline" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground mb-2">Secondary</p>
      <Suggestion suggestion="Secondary variant" variant="secondary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground mb-2">Ghost</p>
      <Suggestion suggestion="Ghost variant" variant="ghost" />
    </div>
  </div>
);

// In chat input context
export const InChatContext: Story = () => (
  <div className="max-w-lg space-y-3">
    <div className="p-4 border rounded-lg">
      <input
        className="w-full px-3 py-2 border rounded-md text-sm mb-3"
        placeholder="Ask me anything about your media library..."
        type="text"
      />
      <Suggestions>
        <Suggestion suggestion="What's downloading?" />
        <Suggestion suggestion="Add Inception" />
        <Suggestion suggestion="Show my queue" />
        <Suggestion suggestion="Recommend something" />
      </Suggestions>
    </div>
  </div>
);

// Empty state suggestions
export const EmptyStateSuggestions: Story = () => (
  <div className="text-center space-y-4 max-w-md mx-auto py-8">
    <h3 className="text-lg font-semibold">Welcome to Assistarr</h3>
    <p className="text-sm text-muted-foreground">
      I can help you manage your media library. Try one of these:
    </p>
    <Suggestions className="justify-center">
      <Suggestion suggestion="What movies do I have?" />
      <Suggestion suggestion="Recommend something to watch" />
      <Suggestion suggestion="Check my downloads" />
    </Suggestions>
  </div>
);

// Long suggestions (scrollable)
export const LongSuggestions: Story = () => (
  <div className="max-w-md">
    <Suggestions>
      <Suggestion suggestion="Show me all my sci-fi movies" />
      <Suggestion suggestion="What's currently downloading?" />
      <Suggestion suggestion="Recommend something based on my history" />
      <Suggestion suggestion="Add The Dark Knight to my library" />
      <Suggestion suggestion="Check Radarr connection status" />
      <Suggestion suggestion="Show recently added content" />
    </Suggestions>
  </div>
);

// Disabled suggestions
export const Disabled: Story = () => (
  <Suggestions>
    <Suggestion disabled suggestion="Loading..." />
    <Suggestion disabled suggestion="Please wait..." />
  </Suggestions>
);
