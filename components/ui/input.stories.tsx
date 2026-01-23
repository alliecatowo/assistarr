import type { Story, StoryDefault } from "@ladle/react";
import { Search } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

export default {
  title: "UI / Input",
} satisfies StoryDefault;

// Default input
export const Default: Story = () => <Input placeholder="Enter text..." />;

// With label
export const WithLabel: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input type="email" id="email" placeholder="Enter your email" />
  </div>
);

// Different types
export const Types: Story = () => (
  <div className="flex flex-col gap-4 w-full max-w-sm">
    <div className="grid gap-1.5">
      <Label htmlFor="text">Text</Label>
      <Input type="text" id="text" placeholder="Enter text" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter email" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" placeholder="Enter password" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="number">Number</Label>
      <Input type="number" id="number" placeholder="Enter number" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="search">Search</Label>
      <Input type="search" id="search" placeholder="Search..." />
    </div>
  </div>
);

// With button
export const WithButton: Story = () => (
  <div className="flex w-full max-w-sm items-center space-x-2">
    <Input type="email" placeholder="Email" />
    <Button type="submit">Subscribe</Button>
  </div>
);

// Disabled state
export const Disabled: Story = () => (
  <div className="flex flex-col gap-4 w-full max-w-sm">
    <Input disabled placeholder="Disabled input" />
    <Input disabled value="Disabled with value" />
  </div>
);

// With icon (using wrapper)
export const WithIcon: Story = () => (
  <div className="relative w-full max-w-sm">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input className="pl-8" placeholder="Search media..." />
  </div>
);

// File input
export const FileInput: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="picture">Picture</Label>
    <Input id="picture" type="file" />
  </div>
);

// Form example
export const FormExample: Story = () => (
  <form className="space-y-4 w-full max-w-sm">
    <div className="grid gap-1.5">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="johndoe" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="email-form">Email</Label>
      <Input id="email-form" type="email" placeholder="john@example.com" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="password-form">Password</Label>
      <Input id="password-form" type="password" placeholder="********" />
    </div>
    <Button type="submit" className="w-full">
      Create Account
    </Button>
  </form>
);
