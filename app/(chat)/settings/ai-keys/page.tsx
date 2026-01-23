"use client";

import {
  CheckCircleIcon,
  ExternalLinkIcon,
  KeyIcon,
  Loader2Icon,
  SparklesIcon,
  XCircleIcon,
  ZapIcon,
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

interface AIProviderConfig {
  id?: string;
  providerName: string;
  apiKey: string; // Masked in responses
  isEnabled: boolean;
  preferredModelTier?: "lite" | "fast" | "heavy" | "thinking";
}

interface ProviderInfo {
  name: string;
  providerName: string;
  description: string;
  placeholder: string;
  docsUrl: string;
}

const AI_PROVIDERS: ProviderInfo[] = [
  {
    name: "OpenRouter",
    providerName: "openrouter",
    description: "Access multiple AI models through a single API (recommended)",
    placeholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    name: "OpenAI",
    providerName: "openai",
    description: "GPT-4, GPT-4o, and other OpenAI models",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    name: "Anthropic",
    providerName: "anthropic",
    description: "Claude 3.5, Claude 3, and other Anthropic models",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    name: "Google AI",
    providerName: "google",
    description: "Gemini 2.0, Gemini 1.5, and other Google models",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
];

// Model tier options for quality/speed tradeoff
const MODEL_TIERS = [
  {
    value: "lite",
    name: "Lite",
    description: "Fast responses, lower cost - great for simple tasks",
  },
  {
    value: "fast",
    name: "Fast",
    description: "Balanced speed and quality - recommended for most tasks",
  },
  {
    value: "heavy",
    name: "Heavy",
    description: "Best quality, slower - for complex reasoning tasks",
  },
  {
    value: "thinking",
    name: "Thinking",
    description: "Extended reasoning - for complex multi-step problems",
  },
] as const;

type ConnectionStatus = "idle" | "testing" | "success" | "error";

interface TestResult {
  status: ConnectionStatus;
  message?: string;
  latency?: number;
}

// Model Tier Selector Component
function ModelTierSelector({
  currentTier,
  onTierChange,
  disabled,
}: {
  currentTier: string;
  onTierChange: (tier: "lite" | "fast" | "heavy" | "thinking") => Promise<void>;
  disabled?: boolean;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (value: string) => {
    setIsSaving(true);
    try {
      await onTierChange(value as "lite" | "fast" | "heavy" | "thinking");
      toast.success(
        `Model tier changed to ${MODEL_TIERS.find((t) => t.value === value)?.name ?? value}`
      );
    } catch (_error) {
      toast.error("Failed to update model tier");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTier = MODEL_TIERS.find((t) => t.value === currentTier);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZapIcon className="size-5" />
          Model Tier
        </CardTitle>
        <CardDescription>
          Choose the balance between response speed and quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-tier">Preferred Tier</Label>
          <Select
            defaultValue={currentTier}
            disabled={disabled || isSaving}
            onValueChange={handleChange}
            value={currentTier}
          >
            <SelectTrigger id="model-tier">
              <SelectValue placeholder="Select a tier" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{tier.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTier && (
          <p className="text-sm text-muted-foreground">
            {selectedTier.description}
          </p>
        )}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Saving...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProviderCard({
  provider,
  config,
  onSave,
  onDelete,
}: {
  provider: ProviderInfo;
  config: AIProviderConfig | undefined;
  onSave: (config: {
    providerName: string;
    apiKey: string;
    isEnabled: boolean;
  }) => Promise<void>;
  onDelete: (providerName: string) => Promise<void>;
}) {
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });

  useEffect(() => {
    // Don't reveal the masked key, just show placeholder
    setApiKey("");
    setIsEnabled(config?.isEnabled ?? true);
    setTestResult({ status: config ? "success" : "idle" });
  }, [config]);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error("API key is required to test");
      return;
    }

    setTestResult({ status: "testing" });

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch("/api/settings/ai-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: provider.providerName,
          apiKey: apiKey.trim(),
        }),
        signal: abortController.signal,
      });

      const data = await response.json();
      clearTimeout(timeoutId);

      if (data.success) {
        setTestResult({
          status: "success",
          message: data.message,
          latency: data.latency,
        });
        toast.success(data.message);
      } else {
        setTestResult({
          status: "error",
          message: data.error,
        });
        toast.error(data.error);
      }
    } catch (_error) {
      clearTimeout(timeoutId);
      setTestResult({
        status: "error",
        message: "Failed to test connection",
      });
      toast.error("Failed to test connection");
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("API key is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        providerName: provider.providerName,
        apiKey: apiKey.trim(),
        isEnabled,
      });
      setApiKey(""); // Clear after successful save
      toast.success(`${provider.name} API key saved`);
    } catch (_error) {
      toast.error(`Failed to save ${provider.name} API key`);
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
      await onDelete(provider.providerName);
      setApiKey("");
      setIsEnabled(true);
      setTestResult({ status: "idle" });
      toast.success(`${provider.name} API key removed`);
    } catch (_error) {
      toast.error(`Failed to remove ${provider.name} API key`);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges =
    apiKey.trim().length > 0 || isEnabled !== (config?.isEnabled ?? true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="size-5" />
              {provider.name}
            </CardTitle>
            <CardDescription>{provider.description}</CardDescription>
          </div>
          {config && (
            <div className="flex items-center gap-2">
              <Label
                className="text-sm"
                htmlFor={`${provider.providerName}-enabled`}
              >
                Enabled
              </Label>
              <Switch
                checked={isEnabled}
                id={`${provider.providerName}-enabled`}
                onCheckedChange={setIsEnabled}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${provider.providerName}-key`}>API Key</Label>
          <Input
            id={`${provider.providerName}-key`}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              config ? `Current: ${config.apiKey}` : provider.placeholder
            }
            type="password"
            value={apiKey}
          />
        </div>
        <a
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          href={provider.docsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Get an API key
          <ExternalLinkIcon className="size-3" />
        </a>
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
          {testResult.status === "success" && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircleIcon className="size-4" />
              {testResult.latency ? (
                <span>{testResult.latency}ms</span>
              ) : (
                <span>Valid</span>
              )}
            </div>
          )}
          {testResult.status === "error" && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <XCircleIcon className="size-4" />
              <span>Failed</span>
            </div>
          )}
          <Button
            disabled={testResult.status === "testing" || !apiKey.trim()}
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

export default function AIKeysSettingsPage() {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch("/api/settings/ai-keys", {
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (_error) {
      clearTimeout(timeoutId);
      // Ignore error during initial load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async (config: {
    providerName: string;
    apiKey: string;
    isEnabled: boolean;
  }) => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch("/api/settings/ai-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const savedConfig = await response.json();
      setConfigs((prev) => {
        const index = prev.findIndex(
          (c) => c.providerName === config.providerName
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = savedConfig;
          return updated;
        }
        return [...prev, savedConfig];
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const handleDelete = async (providerName: string) => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch(
        `/api/settings/ai-keys?providerName=${providerName}`,
        {
          method: "DELETE",
          signal: abortController.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setConfigs((prev) => prev.filter((c) => c.providerName !== providerName));
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const getConfigForProvider = (providerName: string) => {
    return configs.find((c) => c.providerName === providerName);
  };

  const handleTierChange = async (
    tier: "lite" | "fast" | "heavy" | "thinking"
  ) => {
    // Get the first enabled config (the "active" one)
    const activeConfig = configs.find((c) => c.isEnabled);
    if (!activeConfig) {
      throw new Error("No active provider to update tier for");
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch("/api/settings/ai-keys/tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: activeConfig.providerName,
          preferredModelTier: tier,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tier");
      }

      // Update local state
      setConfigs((prev) =>
        prev.map((c) =>
          c.providerName === activeConfig.providerName
            ? { ...c, preferredModelTier: tier }
            : c
        )
      );
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const hasAnyConfig = configs.length > 0;
  const activeConfig = configs.find((c) => c.isEnabled);
  const currentTier = activeConfig?.preferredModelTier ?? "fast";

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
        <h1 className="font-semibold text-lg">AI API Keys</h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Benefits card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <SparklesIcon className="size-5" />
                Bring Your Own API Keys
              </CardTitle>
              <CardDescription>
                Use your own AI provider API keys for higher rate limits and
                direct billing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  <span>Higher rate limits (60 messages/minute vs 10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  <span>Higher daily limits (10,000 messages/day vs 50)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  <span>Direct billing to your provider account</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  <span>Your keys are encrypted at rest</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {hasAnyConfig && (
            <div className="rounded-lg border border-green-600/20 bg-green-600/5 p-4">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircleIcon className="size-4" />
                You&apos;re using your own API keys. Higher rate limits are
                active!
              </p>
            </div>
          )}

          <p className="text-muted-foreground text-sm">
            Configure your own AI provider API keys. Only one provider needs to
            be configured. OpenRouter is recommended as it provides access to
            all major AI models.
          </p>

          {/* Model Tier Selector - only show if user has a config */}
          {hasAnyConfig && (
            <ModelTierSelector
              currentTier={currentTier}
              disabled={!activeConfig}
              onTierChange={handleTierChange}
            />
          )}

          <div className="grid gap-4">
            {AI_PROVIDERS.map((provider) => (
              <ProviderCard
                config={getConfigForProvider(provider.providerName)}
                key={provider.providerName}
                onDelete={handleDelete}
                onSave={handleSave}
                provider={provider}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
