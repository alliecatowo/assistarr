interface ExpandedCardGenresProps {
  genres: string[];
}

export function ExpandedCardGenres({ genres }: ExpandedCardGenresProps) {
  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {genres.map((genre) => (
        <span
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
          key={genre}
        >
          {genre}
        </span>
      ))}
    </div>
  );
}
