import type { Story, StoryDefault } from "@ladle/react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

export default {
  title: "UI / ScrollArea",
} satisfies StoryDefault;

// Default vertical scroll
export const Default: Story = () => (
  <ScrollArea className="h-72 w-48 rounded-md border">
    <div className="p-4">
      <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={`tag-${i + 1}`}>
          <div className="text-sm">v1.2.0-beta.{i + 1}</div>
          <Separator className="my-2" />
        </div>
      ))}
    </div>
  </ScrollArea>
);

// Horizontal scroll
export const Horizontal: Story = () => (
  <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
    <div className="flex w-max space-x-4 p-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <figure key={`artwork-${i + 1}`} className="shrink-0">
          <div className="h-36 w-24 rounded-md bg-muted" />
          <figcaption className="pt-2 text-xs text-muted-foreground">
            Movie {i + 1}
          </figcaption>
        </figure>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);

// Chat history simulation
export const ChatHistory: Story = () => (
  <ScrollArea className="h-80 w-full rounded-md border">
    <div className="p-4 space-y-4">
      {[
        { role: "user", message: "Show me my recent movies" },
        {
          role: "assistant",
          message:
            "Here are your 5 most recently added movies: The Matrix, Inception, Interstellar, Dune, and Blade Runner 2049.",
        },
        { role: "user", message: "Add Oppenheimer to my list" },
        {
          role: "assistant",
          message:
            "I've added Oppenheimer to your watchlist. Would you like me to search for it in available sources?",
        },
        { role: "user", message: "Yes please" },
        {
          role: "assistant",
          message:
            "I found Oppenheimer available in 4K HDR. I've started the download. It should be ready in approximately 45 minutes.",
        },
        { role: "user", message: "What's currently downloading?" },
        {
          role: "assistant",
          message:
            "You have 3 items in your download queue: Oppenheimer (45%), Dune Part Two (78%), and The Batman (12%).",
        },
      ].map((item, i) => (
        <div
          key={`msg-${i}`}
          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              item.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p className="text-sm">{item.message}</p>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

// Movie list
export const MovieList: Story = () => (
  <ScrollArea className="h-72 w-80 rounded-md border">
    <div className="p-4">
      <h4 className="mb-4 font-medium">Recent Movies</h4>
      {[
        { title: "The Matrix", year: 1999, status: "Available" },
        { title: "Inception", year: 2010, status: "Available" },
        { title: "Interstellar", year: 2014, status: "Available" },
        { title: "Dune", year: 2021, status: "Available" },
        { title: "Dune: Part Two", year: 2024, status: "Downloading" },
        { title: "Oppenheimer", year: 2023, status: "Available" },
        { title: "The Batman", year: 2022, status: "Available" },
        { title: "Top Gun: Maverick", year: 2022, status: "Available" },
        { title: "Avatar 2", year: 2022, status: "Available" },
        { title: "No Time to Die", year: 2021, status: "Available" },
      ].map((movie, i) => (
        <div key={`movie-${i}`}>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{movie.title}</p>
              <p className="text-xs text-muted-foreground">{movie.year}</p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                movie.status === "Available"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-yellow-500/20 text-yellow-500"
              }`}
            >
              {movie.status}
            </span>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  </ScrollArea>
);

// Both scrollbars
export const BothDirections: Story = () => (
  <ScrollArea className="h-72 w-72 rounded-md border">
    <div className="p-4" style={{ width: 500, height: 500 }}>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={`cell-${i}`}
            className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-sm"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);
