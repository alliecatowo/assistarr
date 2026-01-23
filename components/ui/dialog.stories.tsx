import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

export default {
  title: "UI / Dialog",
} satisfies StoryDefault;

// Default dialog
export const Default: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogDescription>
          This is a dialog description that explains what this dialog is for.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p>Dialog content goes here.</p>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// With form
export const WithForm: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>Edit Profile</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input id="name" defaultValue="John Doe" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <Input id="username" defaultValue="@johndoe" className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Service configuration dialog
export const ServiceConfig: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>Add Service</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Add Radarr Service</DialogTitle>
        <DialogDescription>
          Configure your Radarr instance to enable movie management.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input id="baseUrl" placeholder="http://localhost:7878" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input id="apiKey" type="password" placeholder="Your Radarr API key" />
          <p className="text-xs text-muted-foreground">
            Find this in Radarr → Settings → General → API Key
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Test Connection</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Confirmation dialog
export const Confirmation: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="destructive">Delete Movie</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. This will permanently delete "The Matrix"
          from your library and remove the associated files.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Media request dialog
export const MediaRequest: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>Request Movie</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Request "Dune: Part Three"</DialogTitle>
        <DialogDescription>
          This movie will be added to your request queue and downloaded when available.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 bg-muted rounded" />
          <div>
            <p className="font-medium">Dune: Part Three</p>
            <p className="text-sm text-muted-foreground">2026 • Sci-Fi</p>
            <p className="text-sm text-muted-foreground">Not yet released</p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Confirm Request</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
