import { ExternalImage } from "@/components/ui/external-image";
import { getPosterUrl } from "@/lib/utils";

interface ExpandedCardPosterProps {
  title: string;
  posterUrl: string | null;
}

export function ExpandedCardPoster({
  title,
  posterUrl,
}: ExpandedCardPosterProps) {
  const fullPosterUrl = getPosterUrl(posterUrl);

  return (
    <div className="shrink-0">
      {fullPosterUrl ? (
        <ExternalImage
          alt={title}
          className="rounded-lg shadow-md"
          height={192}
          src={fullPosterUrl}
          width={128}
        />
      ) : (
        <div className="h-48 w-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
          No Image
        </div>
      )}
    </div>
  );
}
