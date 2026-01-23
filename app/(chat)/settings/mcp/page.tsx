"use client";

import {
  CheckCircleIcon,
  Loader2Icon,
  ServerIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  transport: "sse" | "http";
  apiKey: string | null;
  isEnabled: boolean;
  availableTools: MCPToolInfo[] | null;
  lastHealthCheck: string | null;
}

interface MCPToolInfo {
  name: string;
  description: string;
}

type ConnectionStatus = "idle" | "testing" | "success" | "error";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex form component with multiple states
function MCPServerCard({
  config,
  onUpdate,
  onDelete,
  onTest,
}: {
  config?: MCPServerConfig;
  onUpdate: (data: Partial<MCPServerConfig> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onTest: (data: {
    url: string;
    transport: string;
    apiKey?: string;
  }) => Promise<{
    success: boolean;
    latency?: number;
    tools?: MCPToolInfo[];
    error?: string;
  }>;
}) {
  const [name, setName] = useState(config?.name || "");
  const [url, setUrl] = useState(config?.url || "");
  const [transport, setTransport] = useState<"sse" | "http">(
    config?.transport || "sse"
  );
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [discoveredTools, setDiscoveredTools] = useState<MCPToolInfo[] | null>(
    config?.availableTools || null
  );
  const [showTools, setShowTools] = useState(false);

  const isNew = !config;

  const handleTest = async () => {
    if (!url) {
      toast.error("URL is required");
      return;
    }

    setConnectionStatus("testing");
    try {
      const result = await onTest({
        url,
        transport,
        apiKey: apiKey || undefined,
      });

      if (result.success) {
        setConnectionStatus("success");
        setLatency(result.latency || null);
        setDiscoveredTools(result.tools || null);
        toast.success(
          `Connected! Found ${result.tools?.length || 0} tools (${result.latency}ms)`
        );
      } else {
        setConnectionStatus("error");
        setLatency(null);
        toast.error(result.error || "Connection failed");
      }
    } catch (_error) {
      setConnectionStatus("error");
      toast.error("Connection test failed");
    }
  };

  const handleSave = async () => {
    if (!name || !url) {
      toast.error("Name and URL are required");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        id: config?.id,
        name,
        url,
        transport,
        apiKey: apiKey || null,
        isEnabled,
        availableTools: discoveredTools,
      });
      toast.success(isNew ? "MCP server added" : "MCP server updated");
      if (isNew) {
        // Reset form for new entries
        setName("");
        setUrl("");
        setTransport("sse");
        setApiKey("");
        setIsEnabled(true);
        setDiscoveredTools(null);
        setConnectionStatus("idle");
      }
    } catch (_error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config?.id || !onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(config.id);
      toast.success("MCP server removed");
    } catch (_error) {
      toast.error("Failed to remove");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ServerIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                {isNew ? "Add MCP Server" : config.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {isNew ? "Connect to an external MCP tool server" : config.url}
              </CardDescription>
            </div>
          </div>
          {!isNew && (
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => {
                setIsEnabled(checked);
                onUpdate({ id: config.id, isEnabled: checked });
              }}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${config?.id || "new"}`}>Name</Label>
          <Input
            id={`name-${config?.id || "new"}`}
            onChange={(e) => setName(e.target.value)}
            placeholder="My MCP Server"
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`url-${config?.id || "new"}`}>Server URL</Label>
          <Input
            id={`url-${config?.id || "new"}`}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mcp-server.example.com/mcp"
            value={url}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`transport-${config?.id || "new"}`}>
              Transport
            </Label>
            <Select
              onValueChange={(v) => setTransport(v as "sse" | "http")}
              value={transport}
            >
              <SelectTrigger id={`transport-${config?.id || "new"}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`apikey-${config?.id || "new"}`}>
              API Key (optional)
            </Label>
            <Input
              id={`apikey-${config?.id || "new"}`}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Bearer token"
              type="password"
              value={apiKey}
            />
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus !== "idle" && (
          <div className="flex items-center gap-2 text-sm">
            {connectionStatus === "testing" && (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">
                  Testing connection...
                </span>
              </>
            )}
            {connectionStatus === "success" && (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-green-600">
                  Connected {latency && `(${latency}ms)`}
                </span>
              </>
            )}
            {connectionStatus === "error" && (
              <>
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Connection failed</span>
              </>
            )}
          </div>
        )}

        {/* Discovered Tools */}
        {discoveredTools && discoveredTools.length > 0 && (
          <div className="border-t pt-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowTools(!showTools)}
              type="button"
            >
              <span>Available Tools ({discoveredTools.length})</span>
              <span className="text-xs">{showTools ? "▼" : "▶"}</span>
            </button>
            {showTools && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {discoveredTools.map((tool) => (
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted/60 text-muted-foreground"
                    key={tool.name}
                    title={tool.description}
                  >
                    {tool.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button
            disabled={!url || connectionStatus === "testing"}
            onClick={handleTest}
            variant="outline"
          >
            {connectionStatus === "testing" ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Test Connection
          </Button>
          <Button disabled={!name || !url || isSaving} onClick={handleSave}>
            {isSaving ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isNew ? "Add Server" : "Save"}
          </Button>
        </div>
        {!isNew && onDelete && (
          <Button
            disabled={isDeleting}
            onClick={handleDelete}
            size="icon"
            variant="ghost"
          >
            {isDeleting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2Icon className="h-4 w-4 text-destructive" />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function MCPSettingsPage() {
  const [configs, setConfigs] = useState<MCPServerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/mcp");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (_error) {
      // Silently fail - configs will show as empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleUpdate = async (
    data: Partial<MCPServerConfig> & { id?: string }
  ) => {
    const method = data.id ? "PATCH" : "POST";
    const url = data.id ? `/api/settings/mcp/${data.id}` : "/api/settings/mcp";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save");
    }

    await fetchConfigs();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/settings/mcp/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete");
    }

    await fetchConfigs();
  };

  const handleTest = async (data: {
    url: string;
    transport: string;
    apiKey?: string;
  }) => {
    const response = await fetch("/api/settings/mcp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">MCP Servers</h2>
        <p className="text-sm text-muted-foreground">
          Connect to Model Context Protocol (MCP) servers to add external tools
          to your AI assistant.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Add new server card */}
        <MCPServerCard onTest={handleTest} onUpdate={handleUpdate} />

        {/* Existing servers */}
        {configs.map((config) => (
          <MCPServerCard
            config={config}
            key={config.id}
            onDelete={handleDelete}
            onTest={handleTest}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {configs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ServerIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No MCP servers configured yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Add your first server above to extend your AI with custom tools.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
