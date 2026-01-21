"use client";

import { WrenchIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PureDebugModeButton({
  debugMode,
  onDebugModeChange,
}: {
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
}) {
  return (
    <Button
      className={cn(
        "aspect-square h-8 rounded-lg p-1 transition-colors",
        debugMode
          ? "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30"
          : "hover:bg-accent"
      )}
      data-testid="debug-mode-button"
      onClick={(event) => {
        event.preventDefault();
        onDebugModeChange(!debugMode);
      }}
      variant="ghost"
    >
      <WrenchIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

export const DebugModeButton = memo(PureDebugModeButton);
