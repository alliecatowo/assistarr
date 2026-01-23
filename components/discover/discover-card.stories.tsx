import type { Story, StoryDefault } from "@ladle/react";
import {
  CheckCircleIcon,
  ClockIcon,
  LightbulbIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default {
  title: "Discover / DiscoverCard",
} satisfies StoryDefault;

// Note: These are static stories that don't require the DiscoverContext
// They demonstrate the card UI without the provider dependency

interface MockCardProps {
  title: string;
  year?: number;
  rating?: number;
  mediaType: "movie" | "tv";
  status: "available" | "requested" | "pending" | "unavailable";
  reason?: string;
  showReason?: boolean;
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

const MockDiscoverCard = ({
  title,
  year,
  rating,
  mediaType,
  status,
  reason,
  showReason,
  fillContainer,
}: MockCardProps) => {
  const config = STATUS_CONFIG[status];
  const canRequest = status === "unavailable";

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm",
        "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
        fillContainer ? "w-full" : "w-[160px] shrink-0",
        "cursor-pointer"
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
          No Image
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
          {canRequest && (
            <Button className="w-full" size="sm">
              <PlusIcon className="size-4 mr-1" />
              Request
            </Button>
          )}
          {status === "available" && (
            <Button className="w-full" size="sm" variant="secondary">
              <PlayIcon className="size-4 mr-1" />
              Watch
            </Button>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="w-full p-2.5 space-y-1.5 text-left">
        <h4 className="text-xs font-medium line-clamp-2 min-h-[2rem]">
          {title}
          {year && <span className="text-muted-foreground"> ({year})</span>}
        </h4>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {rating !== undefined && rating > 0 && (
            <span className="text-yellow-500">★ {rating.toFixed(1)}</span>
          )}
          <span className="capitalize">{mediaType === "tv" ? "TV" : "Movie"}</span>
        </div>

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

        {canRequest && (
          <Button
            className="w-full h-7 text-[10px]"
            size="sm"
            variant="outline"
          >
            <PlusIcon className="size-3 mr-1" />
            Request
          </Button>
        )}

        {showReason && reason && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-3 pt-1 border-t flex gap-1">
            <LightbulbIcon className="size-3 shrink-0 mt-0.5 text-yellow-500" />
            <span>{reason}</span>
          </p>
        )}
      </div>
    </div>
  );
};

// Available movie
export const Available: Story = () => (
  <MockDiscoverCard
    title="The Matrix"
    year={1999}
    rating={8.7}
    mediaType="movie"
    status="available"
  />
);

// Requested movie
export const Requested: Story = () => (
  <MockDiscoverCard
    title="Inception"
    year={2010}
    rating={8.8}
    mediaType="movie"
    status="requested"
  />
);

// Pending movie
export const Pending: Story = () => (
  <MockDiscoverCard
    title="Interstellar"
    year={2014}
    rating={8.7}
    mediaType="movie"
    status="pending"
  />
);

// Unavailable (can request)
export const Unavailable: Story = () => (
  <MockDiscoverCard
    title="Dune: Part Two"
    year={2024}
    rating={8.5}
    mediaType="movie"
    status="unavailable"
  />
);

// TV Show
export const TVShow: Story = () => (
  <MockDiscoverCard
    title="Breaking Bad"
    year={2008}
    rating={9.5}
    mediaType="tv"
    status="available"
  />
);

// With AI reason
export const WithAIReason: Story = () => (
  <MockDiscoverCard
    title="Blade Runner 2049"
    year={2017}
    rating={8.0}
    mediaType="movie"
    status="unavailable"
    showReason
    reason="Based on your love for sci-fi visuals and thought-provoking narratives"
  />
);

// Card grid
export const CardGrid: Story = () => (
  <div className="flex flex-wrap gap-4">
    <MockDiscoverCard
      title="The Matrix"
      year={1999}
      rating={8.7}
      mediaType="movie"
      status="available"
    />
    <MockDiscoverCard
      title="Inception"
      year={2010}
      rating={8.8}
      mediaType="movie"
      status="requested"
    />
    <MockDiscoverCard
      title="Breaking Bad"
      year={2008}
      rating={9.5}
      mediaType="tv"
      status="available"
    />
    <MockDiscoverCard
      title="Dune: Part Two"
      year={2024}
      rating={8.5}
      mediaType="movie"
      status="unavailable"
    />
  </div>
);

// Fill container
export const FillContainer: Story = () => (
  <div className="w-48">
    <MockDiscoverCard
      title="The Dark Knight"
      year={2008}
      rating={9.0}
      mediaType="movie"
      status="available"
      fillContainer
    />
  </div>
);
