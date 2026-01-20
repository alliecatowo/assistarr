"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ServiceConfig {
  id?: string;
  serviceName: string;
  baseUrl: string;
  apiKey: string;
  isEnabled: boolean;
}

interface ServiceInfo {
  name: string;
  serviceName: string;
  description: string;
  placeholder: string;
}

const SERVICES: ServiceInfo[] = [
  {
    name: "Radarr",
    serviceName: "radarr",
    description: "Movie collection manager for Usenet and BitTorrent users",
    placeholder: "http://localhost:7878",
  },
  {
    name: "Sonarr",
    serviceName: "sonarr",
    description: "TV series collection manager for Usenet and BitTorrent users",
    placeholder: "http://localhost:8989",
  },
  {
    name: "Jellyfin",
    serviceName: "jellyfin",
    description: "Free software media system for streaming your media",
    placeholder: "http://localhost:8096",
  },
  {
    name: "Jellyseerr",
    serviceName: "jellyseerr",
    description: "Request management and media discovery tool",
    placeholder: "http://localhost:5055",
  },
];

function ServiceCard({
  service,
  config,
  onSave,
  onDelete,
}: {
  service: ServiceInfo;
  config: ServiceConfig | undefined;
  onSave: (config: ServiceConfig) => Promise<void>;
  onDelete: (serviceName: string) => Promise<void>;
}) {
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || "");
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setBaseUrl(config?.baseUrl || "");
    setApiKey(config?.apiKey || "");
    setIsEnabled(config?.isEnabled ?? true);
  }, [config]);

  const handleSave = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      toast.error("Base URL and API Key are required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        serviceName: service.serviceName,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        isEnabled,
      });
      toast.success(`${service.name} configuration saved`);
    } catch (error) {
      toast.error(`Failed to save ${service.name} configuration`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config?.id) return;

    setIsDeleting(true);
    try {
      await onDelete(service.serviceName);
      setBaseUrl("");
      setApiKey("");
      setIsEnabled(true);
      toast.success(`${service.name} configuration removed`);
    } catch (error) {
      toast.error(`Failed to remove ${service.name} configuration`);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges =
    baseUrl !== (config?.baseUrl || "") ||
    apiKey !== (config?.apiKey || "") ||
    isEnabled !== (config?.isEnabled ?? true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{service.name}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`${service.serviceName}-enabled`} className="text-sm">
              Enabled
            </Label>
            <Switch
              id={`${service.serviceName}-enabled`}
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${service.serviceName}-url`}>Base URL</Label>
          <Input
            id={`${service.serviceName}-url`}
            type="url"
            placeholder={service.placeholder}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${service.serviceName}-key`}>API Key</Label>
          <Input
            id={`${service.serviceName}-key`}
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!config?.id || isDeleting}
        >
          {isDeleting ? "Removing..." : "Remove"}
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (config: ServiceConfig) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error("Failed to save config");
    }

    const savedConfig = await response.json();
    setConfigs((prev) => {
      const index = prev.findIndex(
        (c) => c.serviceName === config.serviceName
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedConfig;
        return updated;
      }
      return [...prev, savedConfig];
    });
  };

  const handleDelete = async (serviceName: string) => {
    const response = await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete config");
    }

    setConfigs((prev) => prev.filter((c) => c.serviceName !== serviceName));
  };

  const getConfigForService = (serviceName: string) => {
    return configs.find((c) => c.serviceName === serviceName);
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <h1 className="font-semibold text-lg">Media Service Settings</h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-muted-foreground text-sm">
            Configure your media services to enable Assistarr to help manage
            your media library. Enter the base URL and API key for each service
            you want to use.
          </p>
          <div className="grid gap-4">
            {SERVICES.map((service) => (
              <ServiceCard
                key={service.serviceName}
                service={service}
                config={getConfigForService(service.serviceName)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
