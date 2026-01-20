"use client";

import type { PendingRequest } from "@/app/(monitor)/api/status/route";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PendingRequestsWidgetProps {
  requests: PendingRequest[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Just now";
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

function RequestItem({ request }: { request: PendingRequest }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate" title={request.title}>
          {request.title}
        </p>
        <p className="text-xs text-muted-foreground">
          Requested by {request.requestedBy}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className="text-xs capitalize" variant="outline">
          {request.mediaType === "tv" ? "TV" : "Movie"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(request.requestedAt)}
        </span>
      </div>
    </div>
  );
}

export function PendingRequestsWidget({
  requests,
}: PendingRequestsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Pending Requests
        </CardTitle>
        <Badge className="text-xs" variant="secondary">
          {requests.length} pending
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          {requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No pending requests
            </div>
          ) : (
            requests.map((request) => (
              <RequestItem key={request.id} request={request} />
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
