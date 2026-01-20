"use client";

import type { ServiceStatus } from "@/app/(monitor)/api/status/route";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceStatusCardProps {
  name: string;
  status: ServiceStatus;
}

function StatusIndicator({ status }: { status: ServiceStatus }) {
  if (!status.configured) {
    return (
      <Badge className="text-xs" variant="secondary">
        Not Configured
      </Badge>
    );
  }

  if (!status.enabled) {
    return (
      <Badge className="text-xs" variant="secondary">
        Disabled
      </Badge>
    );
  }

  if (status.online) {
    return (
      <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 text-xs">
        Online
      </Badge>
    );
  }

  return (
    <Badge className="text-xs" variant="destructive">
      Offline
    </Badge>
  );
}

function StatusDot({ status }: { status: ServiceStatus }) {
  if (!status.configured || !status.enabled) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="h-3 w-3 rounded-full bg-muted-foreground/50" />
      </span>
    );
  }

  if (status.online) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
      </span>
    );
  }

  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>
  );
}

export function ServiceStatusCard({ name, status }: ServiceStatusCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        !status.configured && "opacity-50",
        !status.enabled && status.configured && "opacity-70"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
        <StatusDot status={status} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <StatusIndicator status={status} />
        </div>
        {status.error && (
          <p
            className="mt-2 text-xs text-muted-foreground truncate"
            title={status.error}
          >
            {status.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
