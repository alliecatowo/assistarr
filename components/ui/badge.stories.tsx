import type { Story, StoryDefault } from "@ladle/react";
import { Badge, type BadgeProps } from "./badge";

export default {
  title: "UI / Badge",
} satisfies StoryDefault;

// Default badge
export const Default: Story = () => <Badge>Badge</Badge>;

// All variants
export const Variants: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Badge variant="default">Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

// Status badges
export const Status: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
    <Badge className="bg-yellow-500 hover:bg-yellow-600">Downloading</Badge>
    <Badge className="bg-blue-500 hover:bg-blue-600">Requested</Badge>
    <Badge variant="destructive">Missing</Badge>
    <Badge variant="secondary">Unknown</Badge>
  </div>
);

// Media type badges
export const MediaTypes: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Badge variant="outline">Movie</Badge>
    <Badge variant="outline">TV Show</Badge>
    <Badge variant="outline">Season</Badge>
    <Badge variant="outline">Episode</Badge>
  </div>
);

// Quality badges
export const Quality: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Badge className="bg-purple-500 hover:bg-purple-600">4K</Badge>
    <Badge className="bg-blue-500 hover:bg-blue-600">1080p</Badge>
    <Badge variant="secondary">720p</Badge>
    <Badge variant="outline">480p</Badge>
  </div>
);

// In context
export const InContext: Story = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold">The Matrix</h3>
      <Badge>Available</Badge>
      <Badge variant="outline">Movie</Badge>
    </div>
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold">Breaking Bad</h3>
      <Badge className="bg-green-500">Complete</Badge>
      <Badge variant="outline">TV Show</Badge>
    </div>
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold">Dune Part Three</h3>
      <Badge variant="secondary">Requested</Badge>
      <Badge variant="outline">Movie</Badge>
    </div>
  </div>
);

// Interactive with controls
export const Interactive: Story<BadgeProps> = (args) => (
  <Badge {...args}>Interactive Badge</Badge>
);
Interactive.args = {
  variant: "default",
};
Interactive.argTypes = {
  variant: {
    control: { type: "select" },
    options: ["default", "secondary", "destructive", "outline"],
  },
};
