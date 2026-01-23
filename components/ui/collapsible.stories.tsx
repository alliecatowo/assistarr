import type { Story, StoryDefault } from "@ladle/react";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

export default {
  title: "UI / Collapsible",
} satisfies StoryDefault;

// Default collapsible
export const Default: Story = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[350px] space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 font-mono text-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Service status
export const ServiceStatus: Story = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[400px] space-y-2"
    >
      <div className="flex items-center justify-between rounded-md border p-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <h4 className="text-sm font-semibold">Media Services</h4>
          <span className="text-xs text-muted-foreground">3 connected</span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Radarr</span>
          </div>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Sonarr</span>
          </div>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Jellyfin</span>
          </div>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// FAQ item
export const FAQItem: Story = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[500px] rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
        <span className="text-sm font-medium">
          How do I add a new service connection?
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t p-4 text-sm text-muted-foreground">
          To add a new service connection, go to Settings → Services and click
          "Add Service". You'll need to provide the base URL and API key for
          your service. You can find the API key in your service's settings
          under General → Security.
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Multiple FAQ items
export const FAQList: Story = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    {
      question: "How do I request a movie or TV show?",
      answer:
        "Simply type what you're looking for in the chat, and I'll help you find and request it. For example: 'Add The Matrix to my library'.",
    },
    {
      question: "Where do downloads go?",
      answer:
        "Downloads are stored in the location configured in your Radarr/Sonarr settings. Once complete, they're automatically imported into your media library.",
    },
    {
      question: "How do I check download progress?",
      answer:
        "Ask me 'What's downloading?' or 'Show download queue' to see all active downloads and their progress.",
    },
  ];

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <div className="w-[500px] space-y-2">
      {faqs.map((faq, index) => (
        <Collapsible
          key={`faq-${index}`}
          open={openItems.includes(index)}
          onOpenChange={() => toggleItem(index)}
          className="rounded-md border"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <span className="text-sm font-medium text-left">{faq.question}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${openItems.includes(index) ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-4 text-sm text-muted-foreground">
              {faq.answer}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

// Initially open
export const InitiallyOpen: Story = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[350px] space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Advanced Settings</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Quality Profile</p>
          <p className="text-muted-foreground">HD-1080p</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Root Folder</p>
          <p className="text-muted-foreground">/movies</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Monitor</p>
          <p className="text-muted-foreground">Movie and Collection</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
