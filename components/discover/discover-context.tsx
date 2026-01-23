"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * A media item for the discover page with AI reasoning support
 */
export interface DiscoverItem {
  id: number | string;
  title: string;
  year?: number;
  posterUrl?: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  tmdbId?: number;
  status: "available" | "requested" | "pending" | "unavailable";
  reason?: string;
  jellyfinId?: string;
  jellyfinBaseUrl?: string;
  /** Pre-generated AI pitch from top picks - avoids regenerating */
  pitch?: string;
}

/**
 * A section of discover content (e.g., "Trending Now", "Popular Movies")
 */
export interface DiscoverSection {
  id: string;
  title: string;
  items: DiscoverItem[];
}

interface DiscoverState {
  sections: DiscoverSection[];
  mode: "browse" | "ai-controlled";
  activeQuery?: string;
  aiIntro?: string; // "Based on your love of X, here are..."
  isLoading: boolean;
  refineOptions?: string[]; // "More like this", "Funnier", etc.
  expandedItem?: DiscoverItem; // Currently expanded item for inline details
}

interface DiscoverContextValue extends DiscoverState {
  setSections: (sections: DiscoverSection[]) => void;
  showAIResults: (params: {
    query: string;
    intro: string;
    items: DiscoverItem[];
    refineOptions?: string[];
  }) => void;
  clearAIResults: () => void;
  setLoading: (loading: boolean) => void;
  updateItemStatus: (tmdbId: number, status: DiscoverItem["status"]) => void;
  // Submit a query to the AI
  submitQuery: (query: string) => void;
  // Register the submit handler from DiscoverChatBar
  registerSubmitHandler: (handler: (query: string) => void) => void;
  // Expand/collapse item details
  expandItem: (item: DiscoverItem) => void;
  collapseItem: () => void;
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null);

export function DiscoverProvider({
  children,
  initialSections = [],
}: {
  children: ReactNode;
  initialSections?: DiscoverSection[];
}) {
  const [sections, setSectionsState] =
    useState<DiscoverSection[]>(initialSections);
  const [originalSections] = useState<DiscoverSection[]>(initialSections);
  const [mode, setMode] = useState<"browse" | "ai-controlled">("browse");
  const [activeQuery, setActiveQuery] = useState<string>();
  const [aiIntro, setAiIntro] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [refineOptions, setRefineOptions] = useState<string[]>();
  const [expandedItem, setExpandedItem] = useState<DiscoverItem>();

  // Ref to hold the submit handler from DiscoverChatBar
  const submitHandlerRef = useRef<((query: string) => void) | null>(null);

  const setSections = useCallback((newSections: DiscoverSection[]) => {
    setSectionsState(newSections);
  }, []);

  const showAIResults = useCallback(
    ({
      query,
      intro,
      items,
      refineOptions: options,
    }: {
      query: string;
      intro: string;
      items: DiscoverItem[];
      refineOptions?: string[];
    }) => {
      setSectionsState([{ id: "ai-results", title: "Recommendations", items }]);
      setMode("ai-controlled");
      setActiveQuery(query);
      setAiIntro(intro);
      setRefineOptions(
        options ?? [
          "More like this",
          "Something different",
          "Newer releases",
          "Classics",
        ]
      );
      setIsLoading(false);
    },
    []
  );

  const clearAIResults = useCallback(() => {
    setSectionsState(originalSections);
    setMode("browse");
    setActiveQuery(undefined);
    setAiIntro(undefined);
    setRefineOptions(undefined);
  }, [originalSections]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const updateItemStatus = useCallback(
    (tmdbId: number, status: DiscoverItem["status"]) => {
      setSectionsState((prev) =>
        prev.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.tmdbId === tmdbId ? { ...item, status } : item
          ),
        }))
      );
    },
    []
  );

  const registerSubmitHandler = useCallback(
    (handler: (query: string) => void) => {
      submitHandlerRef.current = handler;
    },
    []
  );

  const submitQuery = useCallback((query: string) => {
    if (submitHandlerRef.current) {
      submitHandlerRef.current(query);
    }
  }, []);

  const expandItem = useCallback((item: DiscoverItem) => {
    setExpandedItem(item);
  }, []);

  const collapseItem = useCallback(() => {
    setExpandedItem(undefined);
  }, []);

  const contextValue = useMemo(
    () => ({
      sections,
      mode,
      activeQuery,
      aiIntro,
      isLoading,
      refineOptions,
      setSections,
      showAIResults,
      clearAIResults,
      setLoading,
      updateItemStatus,
      submitQuery,
      registerSubmitHandler,
      expandedItem,
      expandItem,
      collapseItem,
    }),
    [
      sections,
      mode,
      activeQuery,
      aiIntro,
      isLoading,
      refineOptions,
      setSections,
      showAIResults,
      clearAIResults,
      setLoading,
      updateItemStatus,
      submitQuery,
      registerSubmitHandler,
      expandedItem,
      expandItem,
      collapseItem,
    ]
  );

  return (
    <DiscoverContext.Provider value={contextValue}>
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscover() {
  const ctx = useContext(DiscoverContext);
  if (!ctx) {
    throw new Error("useDiscover must be used within DiscoverProvider");
  }
  return ctx;
}
