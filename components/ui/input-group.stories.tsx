import type { Story, StoryDefault } from "@ladle/react";
import { Eye, EyeOff, Key, Link, Mail, Search, X } from "lucide-react";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

export default {
  title: "UI / InputGroup",
} satisfies StoryDefault;

// Default with icon
export const Default: Story = () => (
  <InputGroup className="max-w-sm">
    <InputGroupAddon>
      <Mail className="h-4 w-4" />
    </InputGroupAddon>
    <InputGroupInput placeholder="Email address" type="email" />
  </InputGroup>
);

// Search input
export const SearchInput: Story = () => (
  <InputGroup className="max-w-md">
    <InputGroupAddon>
      <Search className="h-4 w-4" />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search movies, TV shows..." />
    <InputGroupAddon align="inline-end">
      <InputGroupButton size="icon-xs">
        <X className="h-3 w-3" />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);

// URL input
export const URLInput: Story = () => (
  <InputGroup className="max-w-md">
    <InputGroupAddon>
      <InputGroupText>https://</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput placeholder="example.com" />
  </InputGroup>
);

// API key input
export const APIKeyInput: Story = () => {
  const [showKey, setShowKey] = useState(false);

  return (
    <InputGroup className="max-w-md">
      <InputGroupAddon>
        <Key className="h-4 w-4" />
      </InputGroupAddon>
      <InputGroupInput
        type={showKey ? "text" : "password"}
        placeholder="Enter API key"
        defaultValue="sk-1234567890abcdef"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};

// Service configuration
export const ServiceConfig: Story = () => (
  <div className="space-y-4 max-w-md">
    <div className="space-y-2">
      <label className="text-sm font-medium">Base URL</label>
      <InputGroup>
        <InputGroupAddon>
          <Link className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput placeholder="http://localhost:7878" />
      </InputGroup>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">API Key</label>
      <InputGroup>
        <InputGroupAddon>
          <Key className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput type="password" placeholder="Enter your API key" />
      </InputGroup>
    </div>
  </div>
);

// With textarea
export const WithTextarea: Story = () => (
  <InputGroup className="max-w-md">
    <InputGroupTextarea placeholder="Enter your message..." rows={4} />
    <InputGroupAddon align="block-end">
      <InputGroupButton>Send</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);

// Currency input
export const CurrencyInput: Story = () => (
  <InputGroup className="max-w-xs">
    <InputGroupAddon>
      <InputGroupText>$</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput type="number" placeholder="0.00" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>USD</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
);

// With button
export const WithButton: Story = () => (
  <InputGroup className="max-w-md">
    <InputGroupInput placeholder="Enter movie name..." />
    <InputGroupAddon align="inline-end">
      <InputGroupButton variant="default">Search</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);

// Block addons
export const BlockAddons: Story = () => (
  <InputGroup className="max-w-md">
    <InputGroupAddon align="block-start">
      <InputGroupText>Description</InputGroupText>
    </InputGroupAddon>
    <InputGroupTextarea placeholder="Enter a description..." rows={3} />
  </InputGroup>
);
