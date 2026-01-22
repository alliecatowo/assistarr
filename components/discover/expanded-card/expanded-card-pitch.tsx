"use client";

import { SparklesIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PitchData {
  pitch: string;
  hasProfile: boolean;
}

interface ExpandedCardPitchProps {
  pitch: PitchData | null;
  isLoading: boolean;
}

export function ExpandedCardPitch({
  pitch,
  isLoading,
}: ExpandedCardPitchProps) {
  if (isLoading) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SparklesIcon className="size-3.5 animate-pulse" />
          <span>Crafting a personalized pitch...</span>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!pitch) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-start gap-2">
          <SparklesIcon className="size-4 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {pitch.pitch}
            </p>
            {pitch.hasProfile && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Personalized for you
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
