"use client";

import {
  CalendarIcon,
  FlameIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  {
    label: "Surprise me",
    icon: SparklesIcon,
    query:
      "recommend something unexpected based on popular critically acclaimed films",
  },
  {
    label: "Trending",
    icon: FlameIcon,
    query: "show me what's trending right now",
  },
  {
    label: "Coming soon",
    icon: CalendarIcon,
    query: "what movies are coming out soon",
  },
  {
    label: "Hidden gems",
    icon: TrendingUpIcon,
    query: "find underrated highly rated movies",
  },
];

interface QuickActionsProps {
  onAction: (query: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  const handleClick = (query: string) => {
    console.log("[QuickActions] Button clicked with query:", query);
    console.log("[QuickActions] onAction function:", typeof onAction);
    onAction(query);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map(({ label, icon: Icon, query }) => (
        <Button
          className="gap-2"
          disabled={disabled}
          key={label}
          onClick={() => handleClick(query)}
          size="sm"
          variant="outline"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
