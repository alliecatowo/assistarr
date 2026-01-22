"use client";

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  FilterIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DiscoverCard } from "./discover-card";
import { DiscoverProvider, type DiscoverItem } from "./discover-context";
import { ExpandedCard } from "./expanded-card";

interface BrowseItem extends DiscoverItem {
  genres?: string[];
  popularity?: number;
  decade?: string;
}

interface FilterOptions {
  decades: string[];
  ratings: string[];
  sortOptions: { value: string; label: string }[];
}

interface CurrentFilters {
  decade: string | null;
  rating: string | null;
  sort: string;
}

interface BrowseViewProps {
  slug: string;
  initialTitle?: string;
}

export function BrowseView({ slug, initialTitle }: BrowseViewProps) {
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [filters, setFilters] = useState<CurrentFilters>({
    decade: null,
    rating: null,
    sort: "popularity",
  });
  const [expandedItem, setExpandedItem] = useState<DiscoverItem | null>(null);
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Fetch data from API
  const fetchData = useCallback(
    async (pageNum: number, reset = false) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          slug,
          page: String(pageNum),
          sort: filters.sort,
        });

        if (filters.decade) {
          params.set("decade", filters.decade);
        }
        if (filters.rating) {
          params.set("rating", filters.rating);
        }

        const response = await fetch(`/api/discover/category?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await response.json();

        if (reset) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }

        setTitle(data.title);
        setPage(data.page);
        setTotalPages(data.totalPages);

        if (data.filters) {
          setFilterOptions(data.filters);
        }
      } catch (_error) {
        toast.error("Failed to load content");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [slug, filters]
  );

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      fetchData(1, true);
    }
  }, [fetchData]);

  // Refetch when filters change
  useEffect(() => {
    if (!isInitialLoad.current) {
      fetchData(1, true);
    }
  }, [filters, fetchData]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          page < totalPages
        ) {
          fetchData(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [page, totalPages, isLoading, isLoadingMore, fetchData]);

  // Handle filter changes
  const handleDecadeChange = useCallback((decade: string | null) => {
    setFilters((prev) => ({ ...prev, decade }));
  }, []);

  const handleRatingChange = useCallback((rating: string | null) => {
    setFilters((prev) => ({ ...prev, rating }));
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ decade: null, rating: null, sort: "popularity" });
  }, []);

  // Handle media requests
  const handleRequest = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (requestingIds.has(tmdbId)) {
        return;
      }

      setRequestingIds((prev) => new Set(prev).add(tmdbId));

      try {
        const response = await fetch("/api/media/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, mediaType }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to request");
          return;
        }

        toast.success(`Requested ${data.title || "media"}`);

        // Update item status
        setItems((prev) =>
          prev.map((item) =>
            item.tmdbId === tmdbId ? { ...item, status: "requested" } : item
          )
        );
      } catch {
        toast.error("Failed to request");
      } finally {
        setRequestingIds((prev) => {
          const next = new Set(prev);
          next.delete(tmdbId);
          return next;
        });
      }
    },
    [requestingIds]
  );

  const handleStatusChange = useCallback(
    (tmdbId: number, status: DiscoverItem["status"]) => {
      setItems((prev) =>
        prev.map((item) =>
          item.tmdbId === tmdbId ? { ...item, status } : item
        )
      );
    },
    []
  );

  const hasActiveFilters = filters.decade || filters.rating;
  const activeFilterCount = [filters.decade, filters.rating].filter(
    Boolean
  ).length;

  // Wrap in a minimal DiscoverProvider for ExpandedCard functionality
  return (
    <DiscoverProvider>
      <div className="flex h-dvh flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-3 px-4">
            <Button asChild size="icon" variant="ghost">
              <Link href="/discover">
                <ArrowLeftIcon className="size-5" />
                <span className="sr-only">Back to Discover</span>
              </Link>
            </Button>

            <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>

            {/* Filter button (mobile) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  className="relative sm:hidden"
                  size="icon"
                  variant="outline"
                >
                  <FilterIcon className="size-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72" side="right">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {filterOptions && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Decade</label>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.decades.map((d) => (
                            <Button
                              className="h-8 text-xs"
                              key={d}
                              onClick={() =>
                                handleDecadeChange(
                                  filters.decade === d ? null : d
                                )
                              }
                              size="sm"
                              variant={
                                filters.decade === d ? "default" : "outline"
                              }
                            >
                              {d}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          Min Rating
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.ratings.map((r) => (
                            <Button
                              className="h-8 text-xs"
                              key={r}
                              onClick={() =>
                                handleRatingChange(
                                  filters.rating === r ? null : r
                                )
                              }
                              size="sm"
                              variant={
                                filters.rating === r ? "default" : "outline"
                              }
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Sort By</label>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.sortOptions.map((option) => (
                            <Button
                              className="h-8 text-xs"
                              key={option.value}
                              onClick={() => handleSortChange(option.value)}
                              size="sm"
                              variant={
                                filters.sort === option.value
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {hasActiveFilters && (
                    <Button
                      className="w-full"
                      onClick={clearFilters}
                      size="sm"
                      variant="ghost"
                    >
                      <XIcon className="mr-1 size-3" />
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Filter bar (desktop) */}
          <div className="hidden sm:flex items-center gap-2 px-4 pb-3">
            {/* Decade filter */}
            {filterOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 gap-1"
                    size="sm"
                    variant={filters.decade ? "default" : "outline"}
                  >
                    {filters.decade || "Decade"}
                    <ChevronDownIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {filterOptions.decades.map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() =>
                        handleDecadeChange(filters.decade === d ? null : d)
                      }
                    >
                      {d}
                      {filters.decade === d && " *"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Rating filter */}
            {filterOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 gap-1"
                    size="sm"
                    variant={filters.rating ? "default" : "outline"}
                  >
                    {filters.rating ? `Rating ${filters.rating}` : "Rating"}
                    <ChevronDownIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {filterOptions.ratings.map((r) => (
                    <DropdownMenuItem
                      key={r}
                      onClick={() =>
                        handleRatingChange(filters.rating === r ? null : r)
                      }
                    >
                      {r}
                      {filters.rating === r && " *"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort dropdown */}
            {filterOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 gap-1 ml-auto"
                    size="sm"
                    variant="outline"
                  >
                    Sort:{" "}
                    {filterOptions.sortOptions.find(
                      (s) => s.value === filters.sort
                    )?.label || "Popularity"}
                    <ChevronDownIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {filterOptions.sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                      {filters.sort === option.value && " *"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                className="h-8"
                onClick={clearFilters}
                size="sm"
                variant="ghost"
              >
                <XIcon className="mr-1 size-3" />
                Clear
              </Button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Expanded card overlay */}
          {expandedItem && (
            <ExpandedCard
              item={expandedItem}
              onClose={() => setExpandedItem(null)}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <div className="space-y-2" key={i}>
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && (
            <>
              <div
                className={cn(
                  "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                  expandedItem && "opacity-50 pointer-events-none"
                )}
              >
                {items.map((item, index) => (
                  <BrowseCard
                    isRequesting={requestingIds.has(item.tmdbId ?? 0)}
                    item={item}
                    key={`${item.id}-${index}`}
                    onExpand={() => setExpandedItem(item)}
                    onRequest={handleRequest}
                  />
                ))}
              </div>

              {/* Empty state */}
              {items.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <p>No content found matching your filters.</p>
                  {hasActiveFilters && (
                    <Button
                      className="mt-4"
                      onClick={clearFilters}
                      variant="outline"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {/* Load more trigger */}
              <div className="py-8" ref={loadMoreRef}>
                {isLoadingMore && (
                  <div className="flex justify-center">
                    <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {page >= totalPages && items.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    You&apos;ve reached the end
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </DiscoverProvider>
  );
}

// Simplified card component for browse view that triggers expand
interface BrowseCardProps {
  item: BrowseItem;
  onExpand: () => void;
  onRequest: (tmdbId: number, mediaType: "movie" | "tv") => void;
  isRequesting?: boolean;
}

function BrowseCard({
  item,
  onExpand,
  onRequest,
  isRequesting,
}: BrowseCardProps) {
  // Use the standard DiscoverCard but with our own click handler
  return (
    <div onClick={onExpand}>
      <DiscoverCard
        isRequesting={isRequesting}
        item={item}
        onRequest={onRequest}
      />
    </div>
  );
}
