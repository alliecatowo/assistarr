import { StarIcon } from "lucide-react";

interface MediaMetaProps {
  year?: number;
  runtime?: number;
  rating?: number;
  mediaType: "movie" | "tv";
}

export function MediaMeta({
  year,
  runtime,
  rating,
  mediaType,
}: MediaMetaProps) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {year && <span>{year}</span>}
      {runtime && <span>{runtime} min</span>}
      {rating && (
        <span className="flex items-center gap-1 text-yellow-500">
          <StarIcon className="size-4 fill-current" />
          {rating.toFixed(1)}
        </span>
      )}
      <span className="capitalize">
        {mediaType === "tv" ? "TV Show" : "Movie"}
      </span>
    </div>
  );
}
