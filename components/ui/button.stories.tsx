import type { Story, StoryDefault } from "@ladle/react";
import { Loader2, Mail, Plus } from "lucide-react";
import { Button, type ButtonProps } from "./button";

export default {
  title: "UI / Button",
} satisfies StoryDefault;

// Default button
export const Default: Story = () => <Button>Button</Button>;

// All variants
export const Variants: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);

// All sizes
export const Sizes: Story = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">
      <Plus className="h-4 w-4" />
    </Button>
    <Button size="icon-sm">
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);

// With icons
export const WithIcon: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button>
      <Mail className="mr-2 h-4 w-4" /> Login with Email
    </Button>
    <Button variant="secondary">
      <Plus className="mr-2 h-4 w-4" /> Add Item
    </Button>
  </div>
);

// Loading state
export const Loading: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Please wait
    </Button>
    <Button variant="outline" disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </Button>
  </div>
);

// Disabled state
export const Disabled: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button disabled>Disabled</Button>
    <Button variant="secondary" disabled>
      Disabled
    </Button>
    <Button variant="destructive" disabled>
      Disabled
    </Button>
    <Button variant="outline" disabled>
      Disabled
    </Button>
  </div>
);

// Interactive with controls
export const Interactive: Story<ButtonProps> = (args) => (
  <Button {...args}>Interactive Button</Button>
);
Interactive.args = {
  variant: "default",
  size: "default",
  disabled: false,
};
Interactive.argTypes = {
  variant: {
    control: { type: "select" },
    options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
  },
  size: {
    control: { type: "select" },
    options: ["default", "sm", "lg", "icon", "icon-sm"],
  },
  disabled: {
    control: { type: "check" },
  },
};
