"use client";

export function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span
        className="size-1.5 rounded-full bg-current opacity-60"
        style={{
          animation: "streaming-dot 1.4s ease-in-out infinite",
          animationDelay: "0ms",
        }}
      />
      <span
        className="size-1.5 rounded-full bg-current opacity-60"
        style={{
          animation: "streaming-dot 1.4s ease-in-out infinite",
          animationDelay: "150ms",
        }}
      />
      <span
        className="size-1.5 rounded-full bg-current opacity-60"
        style={{
          animation: "streaming-dot 1.4s ease-in-out infinite",
          animationDelay: "300ms",
        }}
      />
    </span>
  );
}
