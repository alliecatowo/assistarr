import type { Story, StoryDefault } from "@ladle/react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorSeparator,
  ModelSelectorTrigger,
} from "./model-selector";

export default {
  title: "Elements / ModelSelector",
} satisfies StoryDefault;

// Default model selector
export const Default: Story = () => (
  <ModelSelector>
    <ModelSelectorTrigger asChild>
      <Button variant="outline">Select Model</Button>
    </ModelSelectorTrigger>
    <ModelSelectorContent>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
        <ModelSelectorGroup heading="OpenAI">
          <ModelSelectorItem>
            <ModelSelectorName>GPT-4o</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>GPT-4o Mini</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>GPT-4 Turbo</ModelSelectorName>
          </ModelSelectorItem>
        </ModelSelectorGroup>
        <ModelSelectorSeparator />
        <ModelSelectorGroup heading="Anthropic">
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3.5 Sonnet</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3 Opus</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3 Haiku</ModelSelectorName>
          </ModelSelectorItem>
        </ModelSelectorGroup>
        <ModelSelectorSeparator />
        <ModelSelectorGroup heading="Google">
          <ModelSelectorItem>
            <ModelSelectorName>Gemini 1.5 Pro</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Gemini 1.5 Flash</ModelSelectorName>
          </ModelSelectorItem>
        </ModelSelectorGroup>
      </ModelSelectorList>
    </ModelSelectorContent>
  </ModelSelector>
);

// With selected item
export const WithSelection: Story = () => (
  <ModelSelector>
    <ModelSelectorTrigger asChild>
      <Button className="justify-between min-w-[200px]" variant="outline">
        <span>Claude 3.5 Sonnet</span>
        <CheckIcon className="h-4 w-4 opacity-50" />
      </Button>
    </ModelSelectorTrigger>
    <ModelSelectorContent>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
        <ModelSelectorGroup heading="Anthropic">
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3.5 Sonnet</ModelSelectorName>
            <CheckIcon className="h-4 w-4" />
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3 Opus</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3 Haiku</ModelSelectorName>
          </ModelSelectorItem>
        </ModelSelectorGroup>
      </ModelSelectorList>
    </ModelSelectorContent>
  </ModelSelector>
);

// Compact trigger
export const CompactTrigger: Story = () => (
  <ModelSelector>
    <ModelSelectorTrigger asChild>
      <Button className="h-7 text-xs" size="sm" variant="ghost">
        GPT-4o
      </Button>
    </ModelSelectorTrigger>
    <ModelSelectorContent>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        <ModelSelectorGroup heading="Models">
          <ModelSelectorItem>
            <ModelSelectorName>GPT-4o</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Claude 3.5 Sonnet</ModelSelectorName>
          </ModelSelectorItem>
          <ModelSelectorItem>
            <ModelSelectorName>Gemini 1.5 Pro</ModelSelectorName>
          </ModelSelectorItem>
        </ModelSelectorGroup>
      </ModelSelectorList>
    </ModelSelectorContent>
  </ModelSelector>
);

// In chat header context
export const InChatHeader: Story = () => (
  <div className="flex items-center gap-2 p-2 border-b">
    <span className="text-sm font-medium">Chat with</span>
    <ModelSelector>
      <ModelSelectorTrigger asChild>
        <Button className="h-8" size="sm" variant="outline">
          Claude 3.5 Sonnet
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorGroup heading="Recommended">
            <ModelSelectorItem>
              <ModelSelectorName>Claude 3.5 Sonnet</ModelSelectorName>
            </ModelSelectorItem>
            <ModelSelectorItem>
              <ModelSelectorName>GPT-4o</ModelSelectorName>
            </ModelSelectorItem>
          </ModelSelectorGroup>
          <ModelSelectorSeparator />
          <ModelSelectorGroup heading="Fast">
            <ModelSelectorItem>
              <ModelSelectorName>GPT-4o Mini</ModelSelectorName>
            </ModelSelectorItem>
            <ModelSelectorItem>
              <ModelSelectorName>Claude 3 Haiku</ModelSelectorName>
            </ModelSelectorItem>
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  </div>
);
