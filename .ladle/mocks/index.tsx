// Mock next/image for Ladle
export const mockNextImage = {
  default: ({ src, alt }: { src: string; alt: string }) => {
    // biome-ignore lint/performance/noImgElement: This mock intentionally uses img to avoid next/image dependency
    return <img alt={alt} src={src} />;
  },
};

// Mock next/navigation
export const mockNavigation = {
  useRouter: () => ({
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    push: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    replace: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    back: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    forward: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    refresh: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    prefetch: () => {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
};

// Mock SWR
export const mockSWR = {
  useSWRConfig: () => ({
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock stub
    mutate: () => {},
  }),
};

// Mock session for next-auth
export const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock media item for discover components
export const mockMediaItem = {
  id: 1,
  title: "Test Movie",
  year: 2024,
  posterUrl: "https://via.placeholder.com/300x450",
  backdropUrl: "https://via.placeholder.com/1920x1080",
  rating: 8.5,
  mediaType: "movie" as const,
  tmdbId: 12_345,
  status: "available" as const,
  overview:
    "This is a test movie for visual testing purposes. It has a compelling plot and great characters.",
  genres: ["Action", "Adventure", "Sci-Fi"],
};

// Mock tool result for tool-results components
export const mockToolResult = {
  success: true,
  message: "Operation completed successfully",
  data: {
    items: [mockMediaItem],
  },
};
