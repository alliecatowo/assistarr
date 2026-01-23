import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Label } from "./label";
import { Switch } from "./switch";

export default {
  title: "UI / Switch",
} satisfies StoryDefault;

// Default switch
export const Default: Story = () => <Switch />;

// Checked state
export const Checked: Story = () => <Switch defaultChecked />;

// Disabled states
export const Disabled: Story = () => (
  <div className="flex flex-col gap-4">
    <Switch disabled />
    <Switch disabled defaultChecked />
  </div>
);

// With label
export const WithLabel: Story = () => (
  <div className="flex items-center space-x-2">
    <Switch id="airplane-mode" />
    <Label htmlFor="airplane-mode">Airplane Mode</Label>
  </div>
);

// Controlled switch
export const Controlled: Story = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="notifications"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="notifications">Enable notifications</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Notifications are {enabled ? "enabled" : "disabled"}
      </p>
    </div>
  );
};

// Settings form
export const SettingsForm: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Auto-download</Label>
        <p className="text-sm text-muted-foreground">
          Automatically download when available
        </p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Notifications</Label>
        <p className="text-sm text-muted-foreground">
          Get notified when downloads complete
        </p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Dark Mode</Label>
        <p className="text-sm text-muted-foreground">
          Use dark theme for the interface
        </p>
      </div>
      <Switch />
    </div>
  </div>
);

// Service toggles
export const ServiceToggles: Story = () => (
  <div className="space-y-4 w-full max-w-md rounded-lg border p-4">
    <h3 className="font-semibold">Service Connections</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm">Radarr</span>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm">Sonarr</span>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-sm">Jellyfin</span>
        </div>
        <Switch />
      </div>
    </div>
  </div>
);
