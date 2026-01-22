interface ExpandedCardOverviewProps {
  overview: string;
  pitch: string | null | undefined;
  showFullOverview: boolean;
  onToggleOverview: () => void;
}

export function ExpandedCardOverview({
  overview,
  pitch,
  showFullOverview,
  onToggleOverview,
}: ExpandedCardOverviewProps) {
  if (!overview) {
    return null;
  }

  if (pitch) {
    return (
      <button
        className="w-full text-left group"
        onClick={onToggleOverview}
        type="button"
      >
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {showFullOverview ? "Hide" : "Show"} full description
        </span>
        {showFullOverview && (
          <p className="mt-1.5 text-sm text-muted-foreground">{overview}</p>
        )}
      </button>
    );
  }

  return (
    <p className="text-sm text-muted-foreground line-clamp-4">{overview}</p>
  );
}
