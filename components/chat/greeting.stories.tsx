import type { Story, StoryDefault } from "@ladle/react";
import { Greeting } from "./greeting";

export default {
  title: "Chat / Greeting",
} satisfies StoryDefault;

// Default greeting
export const Default: Story = () => <Greeting />;

// In container
export const InContainer: Story = () => (
  <div className="h-[400px] border rounded-lg">
    <Greeting />
  </div>
);

// With dark background
export const DarkBackground: Story = () => (
  <div className="h-[400px] bg-zinc-900 rounded-lg">
    <Greeting />
  </div>
);
