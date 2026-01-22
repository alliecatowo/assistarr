"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  LightbulbIcon,
  LoaderIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn, getPosterUrl } from "@/lib/utils";
import { type DiscoverItem, useDiscover } from "./discover-context";

interface DiscoverCardProps {
  item: DiscoverItem;
  showReason?: boolean;
  onRequest: (tmdbId: number, mediaType: "movie" | "tv") => void;
  isRequesting?: boolean;
  /** When true, card fills container width instead of fixed 160px */
  fillContainer?: boolean;
}

const STATUS_CONFIG = {
  available: {
    label: "Available",
    icon: CheckCircleIcon,
    className: "bg-green-500/20 text-green-400",
  },
  requested: {
    label: "Requested",
    icon: ClockIcon,
    className: "bg-blue-500/20 text-blue-400",
  },
  pending: {
    label: "Pending",
    icon: ClockIcon,
    className: "bg-yellow-500/20 text-yellow-400",
  },
  unavailable: { label: null, icon: null, className: "" },
};

export function DiscoverCard({
  item,
  showReason,
  onRequest,
  isRequesting,
  fillContainer,
}: DiscoverCardProps) {
  const { expandItem } = useDiscover();
  const config = STATUS_CONFIG[item.status];
  const canRequest = item.status === "unavailable" && item.tmdbId;

  const posterUrl = getPosterUrl(item.posterUrl);

  const handleCardClick = () => {
    if (item.tmdbId) {
      expandItem(item);
    }
  };

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm",
        "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
        fillContainer ? "w-full" : "w-[160px] shrink-0",
        "cursor-pointer"
      )}
    >
      {/* Poster - clickable for expand */}
      <button
        aria-label={`View details for ${item.title}`}
        className="relative aspect-[2/3] w-full overflow-hidden bg-muted p-0 text-left"
        onClick={handleCardClick}
        type="button"
      >
        {posterUrl ? (
          <Image
            alt={item.title}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            fill
            sizes="160px"
            src={posterUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}

        {/* Overlay action button on hover */}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
          {canRequest && (
            <Button
              className="w-full"
              disabled={isRequesting}
              onClick={(e) => {
                e.stopPropagation();
                item.tmdbId && onRequest(item.tmdbId, item.mediaType);
              }}
              size="sm"
            >
              {isRequesting ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <>
                  <PlusIcon className="size-4 mr-1" />
                  Request
                </>
              )}
            </Button>
          )}
          {item.status === "available" && (
            <Button
              className="w-full"
              onClick={(e) => e.stopPropagation()}
              size="sm"
              variant="secondary"
            >
              <PlayIcon className="size-4 mr-1" />
              Watch
            </Button>
          )}
        </div>
      </button>
      {/* Info section */}
      <div className="w-full p-2.5 space-y-1.5 text-left">
        <h4 className="text-xs font-medium line-clamp-2 min-h-[2rem]">
          {item.title}
          {item.year && (
            <span className="text-muted-foreground"> ({item.year})</span>
          )}
        </h4>

        {/* Rating + Type */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {item.rating !== undefined && item.rating > 0 && (
            <span className="text-yellow-500">★ {item.rating.toFixed(1)}</span>
          )}
          <span className="capitalize">
            {item.mediaType === "tv" ? "TV" : "Movie"}
          </span>
        </div>

        {/* Status Badge (if not unavailable) */}
        {config.label && config.icon && (
          <div
            className={cn(
              "flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              config.className
            )}
          >
            <config.icon className="size-3" />
            {config.label}
          </div>
        )}

        {/* Request button (for unavailable, visible without hover too) */}
        {canRequest && (
          <Button
            className="w-full h-7 text-[10px]"
            disabled={isRequesting}
            onClick={(e) => {
              e.stopPropagation();
              item.tmdbId && onRequest(item.tmdbId, item.mediaType);
            }}
            size="sm"
            variant="outline"
          >
            {isRequesting ? (
              <LoaderIcon className="size-3 animate-spin" />
            ) : (
              <>
                <PlusIcon className="size-3 mr-1" />
                Request
              </>
            )}
          </Button>
        )}

        {/* AI Reason (only in AI mode) */}
        {showReason && item.reason && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-3 pt-1 border-t flex gap-1">
            <LightbulbIcon className="size-3 shrink-0 mt-0.5 text-yellow-500" />
            <span>{item.reason}</span>
          </p>
        )}
      </div>
    </div>
  );
}
