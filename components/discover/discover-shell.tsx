"use client";

import {
  ChevronRightIcon,
  LoaderIcon,
  PanelLeftIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DiscoverChatBar } from "./discover-chat-bar";
import { useDiscover } from "./discover-context";
import { DiscoverGrid } from "./discover-grid";
import { ExpandedCard } from "./expanded-card";
import { ForYouSection } from "./for-you-section";
import { GenreCarousel } from "./genre-carousel";
import { PersonalizedSections } from "./personalized-sections";
import { QuickActions } from "./quick-actions";
import { TopPicksCta } from "./top-picks-cta";

interface DiscoverShellProps {
  userId: string;
}

export function DiscoverShell({ userId }: DiscoverShellProps) {
  const {
    sections,
    mode,
    activeQuery,
    aiIntro,
    isLoading,
    refineOptions,
    clearAIResults,
    submitQuery,
    expandedItem,
    collapseItem,
    updateItemStatus,
  } = useDiscover();

  const { open, setOpen, toggleSidebar } = useSidebar();

  // Auto-collapse sidebar when entering discover page
  useEffect(() => {
    if (open) {
      setOpen(false);
    }
    // Only run on mount, not when `open` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b px-4 gap-3 bg-background transition-all duration-200">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Toggle sidebar"
                className="h-8 w-8 transition-colors hover:bg-accent"
                onClick={toggleSidebar}
                size="icon"
                variant="ghost"
              >
                <PanelLeftIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <h1 className="text-lg font-semibold">Discover</h1>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 transition-all duration-200">
        <div className="mx-auto max-w-7xl w-full">
          {/* Browse Mode: Show prompt + quick actions + genre filters */}
          {mode === "browse" && !isLoading && (
            <>
              <div className="mb-6 text-center">
                <h2 className="mb-3 text-lg font-medium text-muted-foreground">
                  What are you in the mood for?
                </h2>
                <QuickActions disabled={isLoading} onAction={submitQuery} />
                <div className="mt-4">
                  <GenreCarousel />
                </div>
              </div>

              {/* Top Picks CTA - Prominently displayed */}
              <TopPicksCta />
            </>
          )}

          {/* AI Mode: Show query + intro + results */}
          {mode === "ai-controlled" && (
            <div className="mb-6 space-y-4">
              {/* Query indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SparklesIcon className="size-4" />
                  <span>Showing: &quot;{activeQuery}&quot;</span>
                </div>
                <Button onClick={clearAIResults} size="sm" variant="ghost">
                  <XIcon className="mr-1 size-4" />
                  Clear
                </Button>
              </div>

              {/* AI Introduction */}
              {aiIntro && (
                <div className="rounded-lg bg-muted/50 p-4 text-sm italic">
                  &quot;{aiIntro}&quot;
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex animate-pulse items-center gap-2">
                <LoaderIcon className="size-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          {/* Expanded Card (inline details) */}
          {expandedItem && (
            <ExpandedCard
              item={expandedItem}
              onClose={collapseItem}
              onStatusChange={updateItemStatus}
            />
          )}

          {/* Content Grid/Rows */}
          <div
            className={cn(
              "transition-opacity duration-300",
              isLoading && "opacity-30",
              expandedItem && "opacity-50 pointer-events-none"
            )}
          >
            {mode === "ai-controlled" ? (
              // AI results as grid with reasons
              <DiscoverGrid
                items={sections[0]?.items ?? []}
                showReasons={true}
              />
            ) : (
              // Browse mode: Personalized + For You + horizontal rows
              <>
                {/* AI-powered personalized sections */}
                <PersonalizedSections />

                {/* Divider */}
                <div className="my-10 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Trending &amp; Popular
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Legacy For You section (basic genre matching) */}
                <ForYouSection />

                {/* Standard discovery rows */}
                {sections.map((section) => (
                  <section className="mb-8" key={section.id}>
                    <Link
                      className="group mb-3 flex items-center gap-1 text-lg font-semibold hover:text-primary transition-colors w-fit"
                      href={`/discover/category/${section.id}`}
                    >
                      {section.title}
                      <ChevronRightIcon className="size-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                    <DiscoverGrid horizontal items={section.items} />
                  </section>
                ))}
              </>
            )}
          </div>

          {/* Refine Options (after AI results) */}
          {mode === "ai-controlled" &&
            refineOptions &&
            refineOptions.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {refineOptions.map((option) => (
                  <Button
                    disabled={isLoading}
                    key={option}
                    onClick={() => submitQuery(option)}
                    size="sm"
                    variant="outline"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

          {/* Empty State */}
          {sections.length === 0 && !isLoading && mode === "browse" && (
            <div className="py-16 text-center text-muted-foreground">
              <p>Configure Jellyseerr in settings to enable discovery</p>
            </div>
          )}
        </div>
      </main>

      {/* Chat Bar - Fixed at bottom */}
      <DiscoverChatBar userId={userId} />
    </div>
  );
}
