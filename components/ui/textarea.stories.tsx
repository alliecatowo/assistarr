import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";

export default {
  title: "UI / Textarea",
} satisfies StoryDefault;

// Default textarea
export const Default: Story = () => <Textarea placeholder="Type your message here." />;

// With label
export const WithLabel: Story = () => (
  <div className="grid w-full gap-1.5 max-w-sm">
    <Label htmlFor="message">Your message</Label>
    <Textarea placeholder="Type your message here." id="message" />
  </div>
);

// Disabled
export const Disabled: Story = () => (
  <Textarea disabled placeholder="Disabled textarea" />
);

// With text
export const WithText: Story = () => (
  <div className="grid w-full gap-1.5 max-w-sm">
    <Label htmlFor="message-2">Your message</Label>
    <Textarea placeholder="Type your message here." id="message-2" />
    <p className="text-sm text-muted-foreground">
      Your message will be copied to the support team.
    </p>
  </div>
);

// With button
export const WithButton: Story = () => (
  <div className="grid w-full gap-2 max-w-sm">
    <Textarea placeholder="Type your message here." />
    <Button>Send message</Button>
  </div>
);

// Chat input style
export const ChatInput: Story = () => (
  <div className="flex w-full max-w-lg items-end gap-2 rounded-lg border p-2">
    <Textarea
      placeholder="Ask me anything about your media library..."
      className="min-h-[40px] resize-none border-0 p-2 focus-visible:ring-0"
    />
    <Button size="sm">Send</Button>
  </div>
);

// Request description
export const RequestDescription: Story = () => (
  <div className="grid w-full gap-1.5 max-w-md">
    <Label htmlFor="request">Request Details</Label>
    <Textarea
      id="request"
      placeholder="Describe why you want to add this media to your library..."
      className="min-h-[100px]"
    />
    <p className="text-sm text-muted-foreground">
      Optional: Provide context for your request.
    </p>
  </div>
);

// Various sizes
export const Sizes: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <Textarea placeholder="Small" className="min-h-[60px]" />
    <Textarea placeholder="Default" />
    <Textarea placeholder="Large" className="min-h-[150px]" />
  </div>
);

// With character count
export const WithCharacterCount: Story = () => {
  const maxLength = 280;
  const text = "This is some sample text for the textarea.";

  return (
    <div className="grid w-full gap-1.5 max-w-sm">
      <Label htmlFor="with-count">Message</Label>
      <Textarea
        id="with-count"
        defaultValue={text}
        maxLength={maxLength}
      />
      <p className="text-sm text-muted-foreground text-right">
        {text.length}/{maxLength}
      </p>
    </div>
  );
};
