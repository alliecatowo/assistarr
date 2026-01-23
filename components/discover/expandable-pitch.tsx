"use client";

interface ExpandablePitchProps {
  pitch: string;
  className?: string;
}

export function ExpandablePitch({ pitch, className }: ExpandablePitchProps) {
  // Show 3 lines normally
  // On hover, expand to show full text with a background overlay
  return (
    <div className={`relative group/pitch ${className ?? ""}`}>
      {/* Collapsed view: 3 lines with fade */}
      <p className="line-clamp-3 text-sm text-muted-foreground group-hover/pitch:hidden">
        {pitch}
      </p>
      {/* Expanded view on hover */}
      <div className="hidden group-hover/pitch:block absolute inset-x-0 top-0 z-10 bg-card/95 backdrop-blur-sm p-2 rounded-md shadow-lg border">
        <p className="text-sm text-muted-foreground">{pitch}</p>
      </div>
    </div>
  );
}
