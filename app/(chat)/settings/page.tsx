"use client";

import {
  CheckCircleIcon,
  Loader2Icon,
  SearchIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Tool names extracted from each service's definition.ts
const SERVICE_TOOLS: Record<string, string[]> = {
  radarr: [
    "searchRadarrMovies",
    "addRadarrMovie",
    "editRadarrMovie",
    "deleteRadarrMovie",
    "triggerRadarrSearch",
    "refreshRadarrMovie",
    "getRadarrLibrary",
    "getRadarrQualityProfiles",
    "getRadarrQueue",
    "getRadarrCalendar",
    "getRadarrReleases",
    "grabRadarrRelease",
    "removeFromRadarrQueue",
    "getRadarrManualImport",
    "executeRadarrManualImport",
    "scanRadarrDownloadedMovies",
    "getRadarrMovieFiles",
    "renameRadarrMovieFiles",
    "deleteRadarrMovieFile",
    "getRadarrHistory",
    "markRadarrFailed",
    "getRadarrBlocklist",
    "deleteRadarrBlocklist",
    "getRadarrCommandStatus",
  ],
  sonarr: [
    "getSonarrLibrary",
    "getSonarrQualityProfiles",
    "getSonarrQueue",
    "getSonarrCalendar",
    "searchSonarrSeries",
    "getSonarrReleases",
    "getSonarrHistory",
    "getSonarrBlocklist",
    "getSonarrEpisodeFiles",
    "getSonarrManualImport",
    "addSonarrSeries",
    "editSonarrSeries",
    "deleteSonarrSeries",
    "triggerSonarrSearch",
    "refreshSonarrSeries",
    "grabSonarrRelease",
    "removeFromSonarrQueue",
    "executeSonarrManualImport",
    "scanSonarrDownloadedEpisodes",
    "renameSonarrEpisodeFiles",
    "deleteSonarrEpisodeFile",
    "markSonarrFailed",
    "deleteSonarrBlocklist",
    "searchSonarrMissingEpisodes",
    "getSonarrCommandStatus",
  ],
  jellyfin: ["getContinueWatching", "getRecentlyAdded", "searchJellyfinMedia"],
  jellyseerr: [
    "searchContent",
    "requestMedia",
    "getRequests",
    "deleteRequest",
    "getDiscovery",
  ],
  qbittorrent: ["getTorrents", "getTransferInfo", "pauseResumeTorrent"],
};

// Convert camelCase tool names to readable format
function formatToolName(toolName: string): string {
  // Remove service prefix (e.g., "searchRadarrMovies" -> "searchMovies")
  const prefixes = ["Radarr", "Sonarr", "Jellyfin", "Jellyseerr"];
  let name = toolName;
  for (const prefix of prefixes) {
    name = name.replace(prefix, "");
  }
  // Convert camelCase to spaced words and capitalize
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Tool pills component for displaying available tools
function ToolPills({ serviceName }: { serviceName: string }) {
  const tools = SERVICE_TOOLS[serviceName] || [];
  const [isExpanded, setIsExpanded] = useState(false);

  if (tools.length === 0) {
    return null;
  }

  const displayLimit = 6;
  const hasMore = tools.length > displayLimit;
  const displayedTools = isExpanded ? tools : tools.slice(0, displayLimit);
  const hiddenCount = tools.length - displayLimit;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Available Tools
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {tools.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayedTools.map((tool) => (
          <span
            className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors cursor-default"
            key={tool}
            title={tool}
          >
            {formatToolName(tool)}
          </span>
        ))}
        {hasMore && !isExpanded && (
          <button
            className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            +{hiddenCount} more
          </button>
        )}
        {isExpanded && hasMore && (
          <button
            className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setIsExpanded(false)}
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
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
  {
    name: "qBittorrent",
    serviceName: "qbittorrent",
    description: "BitTorrent client for managing your downloads",
    placeholder: "http://localhost:8080",
  },
];

type ConnectionStatus = "idle" | "testing" | "success" | "error";

interface TestResult {
  status: ConnectionStatus;
  message?: string;
  latency?: number;
}

interface DiscoveredService {
  baseUrl: string;
  apiKey: string;
}

function ServiceCard({
  service,
  config,
  onSave,
  onDelete,
  externalBaseUrl,
  externalApiKey,
  onTestSuccess,
}: {
  service: ServiceInfo;
  config: ServiceConfig | undefined;
  onSave: (config: ServiceConfig) => Promise<void>;
  onDelete: (serviceName: string) => Promise<void>;
  externalBaseUrl?: string;
  externalApiKey?: string;
  onTestSuccess?: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || "");
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  // Services should be disabled by default until configured
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });

  // Track if external values have been applied to avoid re-applying
  const appliedExternalRef = useRef<{ baseUrl?: string; apiKey?: string }>({});

  useEffect(() => {
    setBaseUrl(config?.baseUrl || "");
    setApiKey(config?.apiKey || "");
    // Default to disabled if no config exists
    setIsEnabled(config?.isEnabled ?? false);
    // Reset test result when config changes
    setTestResult({ status: "idle" });
  }, [config]);

  // Apply external values when they change (from auto-discovery)
  useEffect(() => {
    if (
      externalBaseUrl &&
      externalApiKey &&
      (appliedExternalRef.current.baseUrl !== externalBaseUrl ||
        appliedExternalRef.current.apiKey !== externalApiKey)
    ) {
      setBaseUrl(externalBaseUrl);
      setApiKey(externalApiKey);
      setTestResult({ status: "idle" });
      appliedExternalRef.current = {
        baseUrl: externalBaseUrl,
        apiKey: externalApiKey,
      };
    }
  }, [externalBaseUrl, externalApiKey]);

  const handleTest = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      toast.error("Base URL and API Key are required to test");
      return;
    }

    setTestResult({ status: "testing" });

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: service.serviceName,
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          status: "success",
          message: data.message,
          latency: data.latency,
        });
        toast.success(data.message);
        onTestSuccess?.();
      } else {
        setTestResult({
          status: "error",
          message: data.error,
        });
        toast.error(data.error);
      }
    } catch (_error) {
      setTestResult({
        status: "error",
        message: "Failed to test connection",
      });
      toast.error("Failed to test connection");
    }
  };

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
    } catch (_error) {
      toast.error(`Failed to save ${service.name} configuration`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config?.id) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(service.serviceName);
      setBaseUrl("");
      setApiKey("");
      setIsEnabled(true);
      toast.success(`${service.name} configuration removed`);
    } catch (_error) {
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
            <Label
              className="text-sm"
              htmlFor={`${service.serviceName}-enabled`}
            >
              Enabled
            </Label>
            <Switch
              checked={isEnabled}
              id={`${service.serviceName}-enabled`}
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
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={service.placeholder}
            type="url"
            value={baseUrl}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${service.serviceName}-key`}>
            {service.serviceName === "qbittorrent" ? "Credentials" : "API Key"}
          </Label>
          <Input
            id={`${service.serviceName}-key`}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              service.serviceName === "qbittorrent"
                ? "username:password"
                : "Enter your API key"
            }
            type="password"
            value={apiKey}
          />
          {service.serviceName === "qbittorrent" && (
            <p className="text-xs text-muted-foreground">
              Format: username:password (e.g., admin:yourpassword)
            </p>
          )}
        </div>
        <ToolPills serviceName={service.serviceName} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          disabled={!config?.id || isDeleting}
          onClick={handleDelete}
          variant="destructive"
        >
          {isDeleting ? "Removing..." : "Remove"}
        </Button>
        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          {testResult.status === "success" && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircleIcon className="size-4" />
              <span>{testResult.latency}ms</span>
            </div>
          )}
          {testResult.status === "error" && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <XCircleIcon className="size-4" />
              <span>Failed</span>
            </div>
          )}
          {/* Test button */}
          <Button
            disabled={
              testResult.status === "testing" ||
              !baseUrl.trim() ||
              !apiKey.trim()
            }
            onClick={handleTest}
            variant="outline"
          >
            {testResult.status === "testing" ? (
              <>
                <Loader2Icon className="size-4 mr-1 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <ZapIcon className="size-4 mr-1" />
                Test
              </>
            )}
          </Button>
          <Button disabled={isSaving || !hasChanges} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [jellyseerrTested, setJellyseerrTested] = useState(false);
  const [discoveredRadarr, setDiscoveredRadarr] = useState<DiscoveredService>();
  const [discoveredSonarr, setDiscoveredSonarr] = useState<DiscoveredService>();

  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

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
      const index = prev.findIndex((c) => c.serviceName === config.serviceName);
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

  const jellyseerrConfig = getConfigForService("jellyseerr");
  const canDiscover = jellyseerrConfig && jellyseerrTested;

  const handleDiscover = async () => {
    if (!jellyseerrConfig) {
      toast.error("Jellyseerr configuration is required for auto-discovery");
      return;
    }

    setIsDiscovering(true);
    try {
      const response = await fetch("/api/settings/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jellyseerrBaseUrl: jellyseerrConfig.baseUrl,
          jellyseerrApiKey: jellyseerrConfig.apiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.cause || "Failed to discover services");
      }

      const data = await response.json();
      const found: string[] = [];

      if (data.radarr) {
        setDiscoveredRadarr(data.radarr);
        found.push(`Radarr at ${data.radarr.baseUrl}`);
      }

      if (data.sonarr) {
        setDiscoveredSonarr(data.sonarr);
        found.push(`Sonarr at ${data.sonarr.baseUrl}`);
      }

      if (found.length > 0) {
        toast.success(`Found: ${found.join(", ")}`, {
          description: "Review the pre-filled configurations and save them.",
          duration: 5000,
        });
      } else {
        toast.info("No Radarr or Sonarr servers found in Jellyseerr settings");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Discovery failed";
      toast.error(message);
    } finally {
      setIsDiscovering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  // Separate Jellyseerr from other services for rendering order
  const jellyseerrService = SERVICES.find(
    (s) => s.serviceName === "jellyseerr"
  );
  const otherServices = SERVICES.filter((s) => s.serviceName !== "jellyseerr");

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
            {/* Render Jellyseerr first */}
            {jellyseerrService && (
              <ServiceCard
                config={getConfigForService(jellyseerrService.serviceName)}
                key={jellyseerrService.serviceName}
                onDelete={handleDelete}
                onSave={handleSave}
                onTestSuccess={() => setJellyseerrTested(true)}
                service={jellyseerrService}
              />
            )}

            {/* Auto-Discovery Card */}
            {jellyseerrConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SearchIcon className="size-5" />
                    Auto-Discovery
                  </CardTitle>
                  <CardDescription>
                    Jellyseerr can share Radarr and Sonarr configurations
                    automatically. Test your Jellyseerr connection first, then
                    click discover to find connected services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={!canDiscover || isDiscovering}
                    onClick={handleDiscover}
                  >
                    {isDiscovering ? (
                      <>
                        <Loader2Icon className="size-4 mr-2 animate-spin" />
                        Discovering...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="size-4 mr-2" />
                        Discover Services
                      </>
                    )}
                  </Button>
                  {!jellyseerrTested && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Test your Jellyseerr connection above to enable
                      auto-discovery.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Render other services */}
            {otherServices.map((service) => (
              <ServiceCard
                config={getConfigForService(service.serviceName)}
                externalApiKey={
                  service.serviceName === "radarr"
                    ? discoveredRadarr?.apiKey
                    : service.serviceName === "sonarr"
                      ? discoveredSonarr?.apiKey
                      : undefined
                }
                externalBaseUrl={
                  service.serviceName === "radarr"
                    ? discoveredRadarr?.baseUrl
                    : service.serviceName === "sonarr"
                      ? discoveredSonarr?.baseUrl
                      : undefined
                }
                key={service.serviceName}
                onDelete={handleDelete}
                onSave={handleSave}
                service={service}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
