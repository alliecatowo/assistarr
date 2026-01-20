"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StalledItem } from "@/app/(monitor)/api/status/route";

interface StalledItemsWidgetProps {
  stalled: StalledItem[];
  failed: StalledItem[];
}

function ItemRow({ item, type }: { item: StalledItem; type: "stalled" | "failed" }) {
  return (
    <div className="py-3 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={item.title}>
            {item.title}
          </p>
          {item.errorMessage && (
            <p className="text-xs text-muted-foreground truncate mt-1" title={item.errorMessage}>
              {item.errorMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={type === "failed" ? "destructive" : "secondary"}
            className="text-xs capitalize"
          >
            {item.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.source}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function StalledItemsWidget({ stalled, failed }: StalledItemsWidgetProps) {
  const totalIssues = stalled.length + failed.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Issues</CardTitle>
        {totalIssues > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
          </Badge>
        ) : (
          <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 text-xs">
            All clear
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          {totalIssues === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No stalled or failed downloads
            </div>
          ) : (
            <>
              {failed.map((item, index) => (
                <ItemRow key={`failed-${item.source}-${item.id}-${index}`} item={item} type="failed" />
              ))}
              {stalled.map((item, index) => (
                <ItemRow key={`stalled-${item.source}-${item.id}-${index}`} item={item} type="stalled" />
              ))}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
