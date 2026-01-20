"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MediaCardProps {
  /** Title of the media item */
  title: string;
  /** Release year */
  year?: number;
  /** Rating (0-10 scale) */
  rating?: number;
  /** Overview/description of the media */
  overview?: string;
  /** URL for the poster/thumbnail image */
  posterUrl?: string | null;
  /** Alt text for the poster image */
  posterAlt?: string;
  /** Array of genre names */
  genres?: string[];
  /** Additional badges to display */
  badges?: React.ReactNode;
  /** Actions to display in the card footer */
  actions?: React.ReactNode;
  /** Additional content to display after the overview */
  children?: React.ReactNode;
  /** Additional className for the card */
  className?: string;
}

export function MediaCard({
  title,
  year,
  rating,
  overview,
  posterUrl,
  posterAlt,
  genres,
  badges,
  actions,
  children,
  className,
}: MediaCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-col sm:flex-row">
        {posterUrl && (
          <div className="relative aspect-[2/3] w-full shrink-0 sm:w-32 md:w-40">
            <img
              src={posterUrl}
              alt={posterAlt || title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-lg">{title}</CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {year && (
                    <span className="text-muted-foreground text-sm">{year}</span>
                  )}
                  {rating !== undefined && rating > 0 && (
                    <span className="flex items-center gap-1 text-sm">
                      <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{rating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>
              {badges && (
                <div className="flex shrink-0 flex-wrap gap-1">{badges}</div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pt-0">
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {genres.slice(0, 4).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {genres.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{genres.length - 4}
                  </Badge>
                )}
              </div>
            )}
            {overview && (
              <CardDescription className="line-clamp-3 text-sm">
                {overview}
              </CardDescription>
            )}
            {children}
            {actions && (
              <div className="mt-auto flex flex-wrap gap-2 pt-2">{actions}</div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
