"use client";

import { useCallback, useEffect, useState } from "react";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";
import {
  DownloadQueueWidget,
  PendingRequestsWidget,
  ServiceStatusCard,
  StalledItemsWidget,
} from "@/components/monitor";
import { Button } from "@/components/ui/button";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export default function MonitorPage() {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30_000);

    try {
      const response = await fetch("/api/status", {
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-4">
          <h1 className="text-lg font-semibold">Monitor</h1>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          className="gap-2"
          disabled={isLoading}
          onClick={fetchStatus}
          size="sm"
          variant="outline"
        >
          <RefreshIcon className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Service Status Grid */}
            <section>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                Services
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <ServiceStatusCard
                  name="Radarr"
                  status={status.services.radarr}
                />
                <ServiceStatusCard
                  name="Sonarr"
                  status={status.services.sonarr}
                />
                <ServiceStatusCard
                  name="Jellyfin"
                  status={status.services.jellyfin}
                />
                <ServiceStatusCard
                  name="Jellyseerr"
                  status={status.services.jellyseerr}
                />
                <ServiceStatusCard
                  name="qBittorrent"
                  status={status.services.qbittorrent}
                />
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Download Queue - Takes 2 columns on large screens */}
              <DownloadQueueWidget
                radarrQueue={status.queues.radarr}
                sonarrQueue={status.queues.sonarr}
                torrents={status.torrents}
              />

              {/* Sidebar widgets */}
              <div className="space-y-6">
                <PendingRequestsWidget requests={status.requests.pending} />
                <StalledItemsWidget
                  failed={status.errors.failed}
                  stalled={status.errors.stalled}
                />
              </div>
            </div>
          </div>
        )}

        {isLoading && !status && (
          <div className="flex items-center justify-center py-12">
            <RefreshIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
