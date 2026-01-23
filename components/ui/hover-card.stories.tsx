import type { Story, StoryDefault } from "@ladle/react";
import { CalendarDays, Film, Star, Tv } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

export default {
  title: "UI / HoverCard",
} satisfies StoryDefault;

// Default hover card
export const Default: Story = () => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Button variant="link">@nextjs</Button>
    </HoverCardTrigger>
    <HoverCardContent className="w-80">
      <div className="flex justify-between space-x-4">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" />
          <AvatarFallback>VC</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">@nextjs</h4>
          <p className="text-sm">
            The React Framework – created and maintained by @vercel.
          </p>
          <div className="flex items-center pt-2">
            <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-xs text-muted-foreground">
              Joined December 2021
            </span>
          </div>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

// Movie info card
export const MovieInfo: Story = () => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Button variant="link" className="p-0 h-auto text-base">
        The Matrix (1999)
      </Button>
    </HoverCardTrigger>
    <HoverCardContent className="w-80">
      <div className="flex gap-4">
        <div className="h-24 w-16 rounded bg-muted flex items-center justify-center">
          <Film className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-semibold">The Matrix</h4>
          <p className="text-xs text-muted-foreground">1999 • Action, Sci-Fi</p>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs">8.7/10</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            A computer hacker learns about the true nature of reality and his role in the war against its controllers.
          </p>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

// TV show info card
export const TVShowInfo: Story = () => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Button variant="link" className="p-0 h-auto text-base">
        Breaking Bad
      </Button>
    </HoverCardTrigger>
    <HoverCardContent className="w-80">
      <div className="flex gap-4">
        <div className="h-24 w-16 rounded bg-muted flex items-center justify-center">
          <Tv className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-semibold">Breaking Bad</h4>
          <p className="text-xs text-muted-foreground">2008-2013 • Drama, Crime</p>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs">9.5/10</span>
          </div>
          <p className="text-xs text-muted-foreground">
            5 Seasons • 62 Episodes
          </p>
          <span className="inline-block rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-600">
            In Library
          </span>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

// Service status card
export const ServiceStatus: Story = () => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm">Radarr</span>
      </div>
    </HoverCardTrigger>
    <HoverCardContent className="w-64">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Radarr</h4>
          <span className="text-xs text-green-600">Connected</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Movies in Library: 847</p>
          <p>Storage Used: 4.2 TB</p>
          <p>Active Downloads: 3</p>
          <p>Last Synced: 2 minutes ago</p>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

// User profile card
export const UserProfile: Story = () => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Avatar className="cursor-pointer">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </HoverCardTrigger>
    <HoverCardContent className="w-64">
      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">John Doe</h4>
          <p className="text-xs text-muted-foreground">john@example.com</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>42 requests</span>
            <span>•</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);
