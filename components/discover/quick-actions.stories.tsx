import type { Story, StoryDefault } from "@ladle/react";
import {
  CalendarIcon,
  FlameIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default {
  title: "Discover / QuickActions",
} satisfies StoryDefault;

// Default quick actions (static version without context dependency)
export const Default: Story = () => (
  <div className="flex flex-wrap justify-center gap-1.5">
    <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
      <SparklesIcon className="size-3" />
      Surprise me
    </Button>
    <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
      <FlameIcon className="size-3" />
      Trending
    </Button>
    <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
      <CalendarIcon className="size-3" />
      Coming soon
    </Button>
    <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
      <TrendingUpIcon className="size-3" />
      Hidden gems
    </Button>
  </div>
);

// Disabled state
export const Disabled: Story = () => (
  <div className="flex flex-wrap justify-center gap-1.5">
    <Button
      className="h-7 gap-1 px-2.5 text-xs"
      disabled
      size="sm"
      variant="outline"
    >
      <SparklesIcon className="size-3" />
      Surprise me
    </Button>
    <Button
      className="h-7 gap-1 px-2.5 text-xs"
      disabled
      size="sm"
      variant="outline"
    >
      <FlameIcon className="size-3" />
      Trending
    </Button>
    <Button
      className="h-7 gap-1 px-2.5 text-xs"
      disabled
      size="sm"
      variant="outline"
    >
      <CalendarIcon className="size-3" />
      Coming soon
    </Button>
    <Button
      className="h-7 gap-1 px-2.5 text-xs"
      disabled
      size="sm"
      variant="outline"
    >
      <TrendingUpIcon className="size-3" />
      Hidden gems
    </Button>
  </div>
);

// In container
export const InContainer: Story = () => (
  <div className="max-w-md mx-auto p-4 bg-card rounded-lg border">
    <h3 className="text-sm font-medium text-center mb-3">Quick Actions</h3>
    <div className="flex flex-wrap justify-center gap-1.5">
      <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
        <SparklesIcon className="size-3" />
        Surprise me
      </Button>
      <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
        <FlameIcon className="size-3" />
        Trending
      </Button>
      <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
        <CalendarIcon className="size-3" />
        Coming soon
      </Button>
      <Button className="h-7 gap-1 px-2.5 text-xs" size="sm" variant="outline">
        <TrendingUpIcon className="size-3" />
        Hidden gems
      </Button>
    </div>
  </div>
);

// Alternative layout (vertical)
export const VerticalLayout: Story = () => (
  <div className="flex flex-col gap-2 max-w-xs">
    <Button className="justify-start gap-2 text-xs" size="sm" variant="outline">
      <SparklesIcon className="size-4" />
      Surprise me with something unexpected
    </Button>
    <Button className="justify-start gap-2 text-xs" size="sm" variant="outline">
      <FlameIcon className="size-4" />
      Show me what's trending now
    </Button>
    <Button className="justify-start gap-2 text-xs" size="sm" variant="outline">
      <CalendarIcon className="size-4" />
      What's coming out soon
    </Button>
    <Button className="justify-start gap-2 text-xs" size="sm" variant="outline">
      <TrendingUpIcon className="size-4" />
      Find underrated hidden gems
    </Button>
  </div>
);
