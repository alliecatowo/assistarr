import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export default {
  title: "UI / Sheet",
} satisfies StoryDefault;

// Default sheet (right side)
export const Default: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open Sheet</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Sheet Title</SheetTitle>
        <SheetDescription>
          This is a sheet description. Make changes here.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4">
        <p>Sheet content goes here.</p>
      </div>
      <SheetFooter>
        <Button type="submit">Save changes</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

// Left side
export const LeftSide: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open Left Sheet</Button>
    </SheetTrigger>
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>Navigation</SheetTitle>
        <SheetDescription>Browse your media library.</SheetDescription>
      </SheetHeader>
      <nav className="flex flex-col gap-2 py-4">
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          Dashboard
        </a>
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          Movies
        </a>
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          TV Shows
        </a>
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          Discover
        </a>
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          Downloads
        </a>
        <a href="#" className="rounded-md px-3 py-2 hover:bg-accent">
          Settings
        </a>
      </nav>
    </SheetContent>
  </Sheet>
);

// Top side
export const TopSide: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open Top Sheet</Button>
    </SheetTrigger>
    <SheetContent side="top">
      <SheetHeader>
        <SheetTitle>Search</SheetTitle>
        <SheetDescription>Search for movies, TV shows, and more.</SheetDescription>
      </SheetHeader>
      <div className="py-4">
        <Input placeholder="Search..." />
      </div>
    </SheetContent>
  </Sheet>
);

// Bottom side
export const BottomSide: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open Bottom Sheet</Button>
    </SheetTrigger>
    <SheetContent side="bottom">
      <SheetHeader>
        <SheetTitle>Quick Actions</SheetTitle>
        <SheetDescription>Common actions for your media.</SheetDescription>
      </SheetHeader>
      <div className="flex gap-2 py-4">
        <Button variant="outline" className="flex-1">
          Add Movie
        </Button>
        <Button variant="outline" className="flex-1">
          Add TV Show
        </Button>
        <Button variant="outline" className="flex-1">
          View Queue
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

// Settings sheet with form
export const SettingsSheet: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button>Edit Settings</Button>
    </SheetTrigger>
    <SheetContent className="sm:max-w-[425px]">
      <SheetHeader>
        <SheetTitle>Edit Service</SheetTitle>
        <SheetDescription>
          Make changes to your Radarr configuration here.
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Radarr" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="url">Base URL</Label>
          <Input id="url" defaultValue="http://localhost:7878" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input id="apiKey" type="password" defaultValue="****" />
        </div>
      </div>
      <SheetFooter>
        <Button variant="outline">Test Connection</Button>
        <Button type="submit">Save changes</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

// Media details sheet
export const MediaDetails: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">View Details</Button>
    </SheetTrigger>
    <SheetContent className="sm:max-w-[500px]">
      <SheetHeader>
        <SheetTitle>The Matrix</SheetTitle>
        <SheetDescription>1999 • Action, Sci-Fi • 2h 16m</SheetDescription>
      </SheetHeader>
      <div className="space-y-4 py-4">
        <div className="aspect-video bg-muted rounded-lg" />
        <p className="text-sm text-muted-foreground">
          A computer hacker learns from mysterious rebels about the true nature
          of his reality and his role in the war against its controllers.
        </p>
        <div className="flex gap-2 text-sm">
          <span className="rounded bg-green-500/20 px-2 py-1 text-green-500">
            Available
          </span>
          <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-500">
            4K
          </span>
        </div>
      </div>
      <SheetFooter>
        <Button variant="outline">More Info</Button>
        <Button>Play</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
