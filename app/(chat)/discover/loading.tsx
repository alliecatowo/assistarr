import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Search bar skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Quick actions skeleton */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Genre chips skeleton */}
      <div className="flex justify-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton className="h-8 w-20 rounded-full" key={i} />
        ))}
      </div>

      {/* Discovery section skeletons */}
      {["For You", "Trending Now", "Popular Movies"].map((title) => (
        <div className="space-y-3" key={title}>
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div className="shrink-0 space-y-2" key={j}>
                <Skeleton className="h-56 w-40 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
