import Image from "next/image";

interface ExpandedCardPosterProps {
  title: string;
  posterUrl: string | null;
}

export function ExpandedCardPoster({
  title,
  posterUrl,
}: ExpandedCardPosterProps) {
  return (
    <div className="shrink-0">
      {posterUrl ? (
        <Image
          alt={title}
          className="rounded-lg shadow-md"
          height={192}
          src={posterUrl}
          unoptimized
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
