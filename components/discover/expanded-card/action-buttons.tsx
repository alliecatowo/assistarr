"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  LoaderIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  status: "available" | "requested" | "pending" | "unavailable";
  isRequesting: boolean;
  onRequest: () => void;
  imdbId?: string;
}

export function ActionButtons({
  status,
  isRequesting,
  onRequest,
  imdbId,
}: ActionButtonsProps) {
  return (
    <div className="mt-4 flex gap-2">
      {status === "available" && (
        <Button size="sm">
          <PlayIcon className="mr-1 size-4" />
          Watch Now
        </Button>
      )}
      {status === "unavailable" && (
        <Button disabled={isRequesting} onClick={onRequest} size="sm">
          {isRequesting ? (
            <LoaderIcon className="mr-1 size-4 animate-spin" />
          ) : (
            <PlusIcon className="mr-1 size-4" />
          )}
          Request
        </Button>
      )}
      {status === "requested" && (
        <Button disabled size="sm" variant="outline">
          <ClockIcon className="mr-1 size-4" />
          Requested
        </Button>
      )}
      {status === "pending" && (
        <Button disabled size="sm" variant="outline">
          <CheckCircleIcon className="mr-1 size-4" />
          Pending
        </Button>
      )}
      {imdbId && (
        <Button asChild size="sm" variant="outline">
          <a
            href={`https://www.imdb.com/title/${imdbId}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon className="mr-1 size-4" />
            IMDb
          </a>
        </Button>
      )}
    </div>
  );
}
