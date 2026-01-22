import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoverItem } from "../discover-context";
import { ExpandedCardBackdrop } from "./expanded-card-backdrop";
import { ExpandedCardGenres } from "./expanded-card-genres";
import { ExpandedCardOverview } from "./expanded-card-overview";
import { ExpandedCardPitch } from "./expanded-card-pitch";
import { ExpandedCardPoster } from "./expanded-card-poster";
import { MediaMeta } from "./media-meta";

interface MediaInfoProps {
  item: DiscoverItem;
  details: {
    title: string;
    year?: number;
    posterUrl: string | null;
    backdropUrl: string | null;
    overview?: string;
    rating?: number;
    runtime?: number;
    genres: string[];
    mediaType: "movie" | "tv";
  } | null;
  pitch?: { pitch: string; hasProfile: boolean } | null;
  isPitchLoading: boolean;
  showFullOverview: boolean;
  onToggleOverview: () => void;
}

export function MediaInfo({
  item,
  details,
  pitch,
  isPitchLoading,
  showFullOverview,
  onToggleOverview,
}: MediaInfoProps) {
  const title = details?.title || item.title;
  const year = details?.year || item.year;
  const posterUrl = (details?.posterUrl || item.posterUrl) ?? null;
  const rating = details?.rating || item.rating;
  const mediaType = details?.mediaType || item.mediaType;

  if (!details) {
    return (
      <div className="flex gap-6">
        <Skeleton className="h-48 w-32 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ExpandedCardBackdrop backdropUrl={details.backdropUrl} />
      <div className="relative z-10 p-6">
        <div className="flex gap-6">
          <ExpandedCardPoster posterUrl={posterUrl} title={title} />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{title}</h2>
            <MediaMeta
              mediaType={mediaType}
              rating={rating}
              runtime={details.runtime}
              year={year}
            />
            <ExpandedCardGenres genres={details.genres} />
            <ExpandedCardPitch
              isLoading={isPitchLoading}
              pitch={
                pitch
                  ? { hasProfile: pitch.hasProfile, pitch: pitch.pitch }
                  : null
              }
            />
            {details.overview && (
              <ExpandedCardOverview
                onToggleOverview={onToggleOverview}
                overview={details.overview}
                pitch={pitch?.pitch || null}
                showFullOverview={showFullOverview}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
