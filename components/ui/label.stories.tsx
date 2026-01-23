import type { Story, StoryDefault } from "@ladle/react";
import { Checkbox } from "radix-ui";
import { Input } from "./input";
import { Label } from "./label";

export default {
  title: "UI / Label",
} satisfies StoryDefault;

// Default label
export const Default: Story = () => <Label>Label Text</Label>;

// With input
export const WithInput: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input type="email" id="email" placeholder="Enter your email" />
  </div>
);

// With required indicator
export const Required: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="username">
      Username <span className="text-destructive">*</span>
    </Label>
    <Input id="username" placeholder="Enter username" required />
  </div>
);

// With description
export const WithDescription: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="api-key">API Key</Label>
    <Input id="api-key" placeholder="Enter your API key" />
    <p className="text-sm text-muted-foreground">
      Find your API key in Radarr Settings &gt; General
    </p>
  </div>
);

// Disabled state
export const Disabled: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="disabled" className="peer-disabled:opacity-70">
      Disabled Field
    </Label>
    <Input id="disabled" disabled placeholder="This field is disabled" />
  </div>
);

// Form with multiple labels
export const FormExample: Story = () => (
  <form className="space-y-4 w-full max-w-sm">
    <div className="grid gap-1.5">
      <Label htmlFor="service-name">Service Name</Label>
      <Input id="service-name" placeholder="e.g., Radarr" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="base-url">
        Base URL <span className="text-destructive">*</span>
      </Label>
      <Input id="base-url" placeholder="http://localhost:7878" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="api-key-form">
        API Key <span className="text-destructive">*</span>
      </Label>
      <Input id="api-key-form" type="password" placeholder="Your API key" />
      <p className="text-sm text-muted-foreground">
        Required for authentication
      </p>
    </div>
  </form>
);

// With checkbox (using radix directly for story)
export const WithCheckbox: Story = () => (
  <div className="flex items-center space-x-2">
    <Checkbox.Root
      id="terms"
      className="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
    >
      <Checkbox.Indicator className="flex items-center justify-center text-current">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </Checkbox.Indicator>
    </Checkbox.Root>
    <Label htmlFor="terms">Accept terms and conditions</Label>
  </div>
);
