import type { Story, StoryDefault } from "@ladle/react";
import { HelpCircle, Info, Plus, Settings } from "lucide-react";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export default {
  title: "UI / Tooltip",
} satisfies StoryDefault;

// Default tooltip
export const Default: Story = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Different sides
export const Sides: Story = () => (
  <TooltipProvider>
    <div className="flex items-center justify-center gap-8 p-16">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

// Icon button with tooltip
export const IconButtons: Story = () => (
  <TooltipProvider>
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new item</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Help & Support</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

// Help icon inline
export const HelpIcon: Story = () => (
  <TooltipProvider>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">API Key</span>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p>Find your API key in Settings → General → Security</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

// With keyboard shortcut
export const WithShortcut: Story = () => (
  <TooltipProvider>
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Save</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Save changes{" "}
            <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">⌘S</kbd>
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Search</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Search{" "}
            <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">⌘K</kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

// Status tooltips
export const StatusTooltips: Story = () => (
  <TooltipProvider>
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger>
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Service is online</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Service is degraded</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <div className="h-3 w-3 rounded-full bg-red-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Service is offline</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
