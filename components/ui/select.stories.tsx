import type { Story, StoryDefault } from "@ladle/react";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

export default {
  title: "UI / Select",
} satisfies StoryDefault;

// Default select
export const Default: Story = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="blueberry">Blueberry</SelectItem>
      <SelectItem value="grapes">Grapes</SelectItem>
      <SelectItem value="pineapple">Pineapple</SelectItem>
    </SelectContent>
  </Select>
);

// With label
export const WithLabel: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="quality">Quality</Label>
    <Select>
      <SelectTrigger id="quality">
        <SelectValue placeholder="Select quality" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="4k">4K (2160p)</SelectItem>
        <SelectItem value="1080p">1080p</SelectItem>
        <SelectItem value="720p">720p</SelectItem>
        <SelectItem value="480p">480p</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// With groups
export const WithGroups: Story = () => (
  <Select>
    <SelectTrigger className="w-[280px]">
      <SelectValue placeholder="Select a service" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Media Management</SelectLabel>
        <SelectItem value="radarr">Radarr</SelectItem>
        <SelectItem value="sonarr">Sonarr</SelectItem>
        <SelectItem value="lidarr">Lidarr</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Media Servers</SelectLabel>
        <SelectItem value="jellyfin">Jellyfin</SelectItem>
        <SelectItem value="plex">Plex</SelectItem>
        <SelectItem value="emby">Emby</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Requests</SelectLabel>
        <SelectItem value="jellyseerr">Jellyseerr</SelectItem>
        <SelectItem value="overseerr">Overseerr</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

// AI Model selector
export const AIModelSelector: Story = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label>AI Model</Label>
    <Select defaultValue="gpt-4o">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>OpenAI</SelectLabel>
          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Anthropic</SelectLabel>
          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Google</SelectLabel>
          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
          <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);

// Disabled state
export const Disabled: Story = () => (
  <div className="space-y-4">
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option">Option</SelectItem>
      </SelectContent>
    </Select>

    <Select defaultValue="selected" disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="selected">Selected value</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// With disabled items
export const DisabledItems: Story = () => (
  <Select>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Select download client" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="qbittorrent">qBittorrent</SelectItem>
      <SelectItem value="transmission">Transmission</SelectItem>
      <SelectItem value="deluge" disabled>
        Deluge (Not configured)
      </SelectItem>
      <SelectItem value="rtorrent" disabled>
        rTorrent (Not configured)
      </SelectItem>
    </SelectContent>
  </Select>
);

// Form with multiple selects
export const FormExample: Story = () => (
  <form className="space-y-4 w-full max-w-sm">
    <div className="grid gap-1.5">
      <Label>Media Type</Label>
      <Select defaultValue="movie">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="movie">Movie</SelectItem>
          <SelectItem value="tv">TV Show</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid gap-1.5">
      <Label>Quality Profile</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ultra-hd">Ultra-HD</SelectItem>
          <SelectItem value="hd">HD-1080p</SelectItem>
          <SelectItem value="sd">SD</SelectItem>
          <SelectItem value="any">Any</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid gap-1.5">
      <Label>Root Folder</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="/movies">/movies</SelectItem>
          <SelectItem value="/movies/4k">/movies/4k</SelectItem>
          <SelectItem value="/movies/kids">/movies/kids</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </form>
);
