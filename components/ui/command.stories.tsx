import type { Story, StoryDefault } from "@ladle/react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Film,
  Search,
  Settings,
  Smile,
  Tv,
  User,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

export default {
  title: "UI / Command",
} satisfies StoryDefault;

// Default command menu
export const Default: Story = () => (
  <Command className="rounded-lg border shadow-md max-w-md">
    <CommandInput placeholder="Type a command or search..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem>
          <Calendar className="mr-2 h-4 w-4" />
          <span>Calendar</span>
        </CommandItem>
        <CommandItem>
          <Smile className="mr-2 h-4 w-4" />
          <span>Search Emoji</span>
        </CommandItem>
        <CommandItem>
          <Calculator className="mr-2 h-4 w-4" />
          <span>Calculator</span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Settings">
        <CommandItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
          <CommandShortcut>⌘P</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
          <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
          <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

// Media search command
export const MediaSearch: Story = () => (
  <Command className="rounded-lg border shadow-md max-w-md">
    <CommandInput placeholder="Search movies and TV shows..." />
    <CommandList>
      <CommandEmpty>No media found.</CommandEmpty>
      <CommandGroup heading="Movies">
        <CommandItem>
          <Film className="mr-2 h-4 w-4" />
          <span>The Matrix (1999)</span>
        </CommandItem>
        <CommandItem>
          <Film className="mr-2 h-4 w-4" />
          <span>Inception (2010)</span>
        </CommandItem>
        <CommandItem>
          <Film className="mr-2 h-4 w-4" />
          <span>Interstellar (2014)</span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="TV Shows">
        <CommandItem>
          <Tv className="mr-2 h-4 w-4" />
          <span>Breaking Bad</span>
        </CommandItem>
        <CommandItem>
          <Tv className="mr-2 h-4 w-4" />
          <span>The Office</span>
        </CommandItem>
        <CommandItem>
          <Tv className="mr-2 h-4 w-4" />
          <span>Game of Thrones</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

// Quick actions
export const QuickActions: Story = () => (
  <Command className="rounded-lg border shadow-md max-w-md">
    <CommandInput placeholder="What would you like to do?" />
    <CommandList>
      <CommandEmpty>No actions found.</CommandEmpty>
      <CommandGroup heading="Quick Actions">
        <CommandItem>
          <Search className="mr-2 h-4 w-4" />
          <span>Search for a movie</span>
        </CommandItem>
        <CommandItem>
          <Film className="mr-2 h-4 w-4" />
          <span>Add a movie to library</span>
        </CommandItem>
        <CommandItem>
          <Tv className="mr-2 h-4 w-4" />
          <span>Add a TV show to library</span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Navigation">
        <CommandItem>
          <span>Go to Dashboard</span>
          <CommandShortcut>⌘D</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <span>Go to Discover</span>
          <CommandShortcut>⌘E</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <span>Go to Settings</span>
          <CommandShortcut>⌘,</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

// Empty state
export const EmptyState: Story = () => (
  <Command className="rounded-lg border shadow-md max-w-md">
    <CommandInput placeholder="Search..." />
    <CommandList>
      <CommandEmpty>
        <div className="py-6 text-center">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No results found. Try a different search.
          </p>
        </div>
      </CommandEmpty>
    </CommandList>
  </Command>
);

// Compact version
export const Compact: Story = () => (
  <Command className="rounded-lg border shadow-md max-w-sm">
    <CommandInput placeholder="Search..." />
    <CommandList className="max-h-[200px]">
      <CommandGroup>
        <CommandItem>Option 1</CommandItem>
        <CommandItem>Option 2</CommandItem>
        <CommandItem>Option 3</CommandItem>
        <CommandItem>Option 4</CommandItem>
        <CommandItem>Option 5</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);
