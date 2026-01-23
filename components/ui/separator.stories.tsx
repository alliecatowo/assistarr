import type { Story, StoryDefault } from "@ladle/react";
import { Separator } from "./separator";

export default {
  title: "UI / Separator",
} satisfies StoryDefault;

// Default horizontal separator
export const Default: Story = () => (
  <div className="w-full max-w-md">
    <div className="space-y-1">
      <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
      <p className="text-sm text-muted-foreground">
        An open-source UI component library.
      </p>
    </div>
    <Separator className="my-4" />
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div>
  </div>
);

// Horizontal separator
export const Horizontal: Story = () => (
  <div className="w-full max-w-md space-y-4">
    <p>Content above the separator</p>
    <Separator />
    <p>Content below the separator</p>
  </div>
);

// Vertical separator
export const Vertical: Story = () => (
  <div className="flex h-10 items-center space-x-4">
    <span>Item 1</span>
    <Separator orientation="vertical" />
    <span>Item 2</span>
    <Separator orientation="vertical" />
    <span>Item 3</span>
  </div>
);

// In a navigation context
export const NavigationContext: Story = () => (
  <nav className="flex items-center space-x-4 text-sm">
    <a href="#" className="text-foreground hover:text-primary">
      Home
    </a>
    <Separator orientation="vertical" className="h-4" />
    <a href="#" className="text-muted-foreground hover:text-primary">
      Movies
    </a>
    <Separator orientation="vertical" className="h-4" />
    <a href="#" className="text-muted-foreground hover:text-primary">
      TV Shows
    </a>
    <Separator orientation="vertical" className="h-4" />
    <a href="#" className="text-muted-foreground hover:text-primary">
      Discover
    </a>
  </nav>
);

// Section divider
export const SectionDivider: Story = () => (
  <div className="space-y-6">
    <section>
      <h2 className="text-lg font-semibold mb-2">Movies</h2>
      <p className="text-sm text-muted-foreground">
        Your movie collection and recommendations
      </p>
    </section>
    <Separator />
    <section>
      <h2 className="text-lg font-semibold mb-2">TV Shows</h2>
      <p className="text-sm text-muted-foreground">
        Your TV show collection and recommendations
      </p>
    </section>
    <Separator />
    <section>
      <h2 className="text-lg font-semibold mb-2">Downloads</h2>
      <p className="text-sm text-muted-foreground">
        Active downloads and queue management
      </p>
    </section>
  </div>
);

// In a list
export const InList: Story = () => (
  <div className="space-y-0">
    {["The Matrix", "Inception", "Interstellar", "Dune"].map((movie, index, arr) => (
      <div key={movie}>
        <div className="py-3">
          <p className="font-medium">{movie}</p>
          <p className="text-sm text-muted-foreground">Movie</p>
        </div>
        {index < arr.length - 1 && <Separator />}
      </div>
    ))}
  </div>
);

// With custom styling
export const CustomStyling: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <Separator className="bg-primary" />
    <Separator className="bg-destructive" />
    <Separator className="bg-muted-foreground/20" />
    <Separator className="h-[2px]" />
    <Separator className="h-[4px] rounded-full bg-gradient-to-r from-primary to-destructive" />
  </div>
);
