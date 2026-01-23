import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

export default {
  title: "UI / Card",
} satisfies StoryDefault;

// Default card
export const Default: Story = () => (
  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card description goes here.</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card content with some text explaining the feature.</p>
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
);

// Simple card
export const Simple: Story = () => (
  <Card className="w-[350px] p-6">
    <p>A simple card with just content and padding.</p>
  </Card>
);

// Card with actions
export const WithActions: Story = () => (
  <Card className="w-[400px]">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Manage your project configuration</CardDescription>
        </div>
        <CardAction>
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button size="sm">Save</Button>
        </CardAction>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Configure your project settings including API keys, webhooks, and integrations.
      </p>
    </CardContent>
  </Card>
);

// Card grid
export const CardGrid: Story = () => (
  <div className="grid grid-cols-2 gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Movies</CardTitle>
        <CardDescription>1,234 items</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">85%</p>
        <p className="text-xs text-muted-foreground">Available</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>TV Shows</CardTitle>
        <CardDescription>567 items</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">92%</p>
        <p className="text-xs text-muted-foreground">Available</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Downloads</CardTitle>
        <CardDescription>Active queue</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">12</p>
        <p className="text-xs text-muted-foreground">In progress</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Requests</CardTitle>
        <CardDescription>Pending approval</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">8</p>
        <p className="text-xs text-muted-foreground">Awaiting</p>
      </CardContent>
    </Card>
  </div>
);

// Minimal header card
export const MinimalHeader: Story = () => (
  <Card className="w-[350px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Quick Stats</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between">
        <div>
          <p className="text-2xl font-bold">2,847</p>
          <p className="text-xs text-muted-foreground">Total Items</p>
        </div>
        <div>
          <p className="text-2xl font-bold">98.2%</p>
          <p className="text-xs text-muted-foreground">Uptime</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
