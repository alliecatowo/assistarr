import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
} from "@/components/ui/icons";

export default {
  title: "Elements / VisibilitySelector",
} satisfies StoryDefault;

// Note: Using mock component to avoid hook dependencies

// Private selected
export const PrivateSelected: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-8 md:h-fit md:px-2" variant="outline">
        <LockIcon />
        <span className="md:sr-only">Private</span>
        <ChevronDownIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-[300px]">
      <DropdownMenuItem
        className="group/item flex flex-row items-center justify-between gap-4"
        data-active="true"
      >
        <div className="flex flex-col items-start gap-1">
          Private
          <div className="text-muted-foreground text-xs">
            Only you can access this chat
          </div>
        </div>
        <div className="text-foreground opacity-100">
          <CheckCircleFillIcon />
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem className="group/item flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          Public
          <div className="text-muted-foreground text-xs">
            Anyone with the link can access this chat
          </div>
        </div>
        <div className="text-foreground opacity-0">
          <CheckCircleFillIcon />
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Public selected
export const PublicSelected: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-8 md:h-fit md:px-2" variant="outline">
        <GlobeIcon />
        <span className="md:sr-only">Public</span>
        <ChevronDownIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-[300px]">
      <DropdownMenuItem className="group/item flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          Private
          <div className="text-muted-foreground text-xs">
            Only you can access this chat
          </div>
        </div>
        <div className="text-foreground opacity-0">
          <CheckCircleFillIcon />
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="group/item flex flex-row items-center justify-between gap-4"
        data-active="true"
      >
        <div className="flex flex-col items-start gap-1">
          Public
          <div className="text-muted-foreground text-xs">
            Anyone with the link can access this chat
          </div>
        </div>
        <div className="text-foreground opacity-100">
          <CheckCircleFillIcon />
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// In header context
export const InHeaderContext: Story = () => (
  <header className="flex items-center gap-2 bg-background px-2 py-1.5 border-b">
    <Button variant="ghost" size="sm">
      Toggle Sidebar
    </Button>
    <Button variant="outline" className="ml-auto h-8">
      New Chat
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 md:h-fit md:px-2" variant="outline">
          <LockIcon />
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        <DropdownMenuItem
          className="group/item flex flex-row items-center justify-between gap-4"
          data-active="true"
        >
          <div className="flex flex-col items-start gap-1">
            Private
            <div className="text-muted-foreground text-xs">
              Only you can access this chat
            </div>
          </div>
          <div className="text-foreground opacity-100">
            <CheckCircleFillIcon />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="group/item flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            Public
            <div className="text-muted-foreground text-xs">
              Anyone with the link can access this chat
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
);

// Icon-only button
export const IconOnly: Story = () => (
  <div className="flex gap-4">
    <Button className="h-8 px-2" variant="outline">
      <LockIcon />
      <ChevronDownIcon />
    </Button>
    <Button className="h-8 px-2" variant="outline">
      <GlobeIcon />
      <ChevronDownIcon />
    </Button>
  </div>
);
