import type { Story, StoryDefault } from "@ladle/react";
import { ChevronDown, Grid, List, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "./button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";

export default {
  title: "UI / ButtonGroup",
} satisfies StoryDefault;

// Default button group
export const Default: Story = () => (
  <ButtonGroup>
    <Button variant="outline">Left</Button>
    <Button variant="outline">Center</Button>
    <Button variant="outline">Right</Button>
  </ButtonGroup>
);

// View toggle
export const ViewToggle: Story = () => (
  <ButtonGroup>
    <Button variant="outline" size="icon">
      <Grid className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon">
      <List className="h-4 w-4" />
    </Button>
  </ButtonGroup>
);

// With separator
export const WithSeparator: Story = () => (
  <ButtonGroup>
    <Button variant="outline">Save</Button>
    <ButtonGroupSeparator />
    <Button variant="outline" size="icon">
      <ChevronDown className="h-4 w-4" />
    </Button>
  </ButtonGroup>
);

// Primary action with dropdown
export const PrimaryWithDropdown: Story = () => (
  <ButtonGroup>
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add to Library
    </Button>
    <Button size="icon" className="px-2">
      <ChevronDown className="h-4 w-4" />
    </Button>
  </ButtonGroup>
);

// With text label
export const WithTextLabel: Story = () => (
  <ButtonGroup>
    <ButtonGroupText>Filter:</ButtonGroupText>
    <Button variant="outline">All</Button>
    <Button variant="outline">Movies</Button>
    <Button variant="outline">TV Shows</Button>
  </ButtonGroup>
);

// Vertical orientation
export const Vertical: Story = () => (
  <ButtonGroup orientation="vertical">
    <Button variant="outline">Top</Button>
    <Button variant="outline">Middle</Button>
    <Button variant="outline">Bottom</Button>
  </ButtonGroup>
);

// Media type selector
export const MediaTypeSelector: Story = () => (
  <ButtonGroup>
    <Button variant="default">Movies</Button>
    <Button variant="outline">TV Shows</Button>
    <Button variant="outline">Anime</Button>
  </ButtonGroup>
);

// Quality selector
export const QualitySelector: Story = () => (
  <ButtonGroup>
    <Button variant="outline" size="sm">SD</Button>
    <Button variant="outline" size="sm">HD</Button>
    <Button variant="default" size="sm">4K</Button>
    <Button variant="outline" size="sm">Any</Button>
  </ButtonGroup>
);

// Action buttons
export const ActionButtons: Story = () => (
  <ButtonGroup>
    <Button variant="outline">Edit</Button>
    <Button variant="outline">Duplicate</Button>
    <Button variant="outline" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </ButtonGroup>
);

// Mixed sizes
export const MixedContent: Story = () => (
  <div className="space-y-4">
    <ButtonGroup>
      <Button variant="outline" size="sm">Small</Button>
      <Button variant="outline" size="sm">Group</Button>
    </ButtonGroup>
    <ButtonGroup>
      <Button variant="outline">Default</Button>
      <Button variant="outline">Group</Button>
    </ButtonGroup>
    <ButtonGroup>
      <Button variant="outline" size="lg">Large</Button>
      <Button variant="outline" size="lg">Group</Button>
    </ButtonGroup>
  </div>
);
