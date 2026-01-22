import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { MediaStatus } from "@/lib/plugins/jellyseerr/types";

interface JellyseerrDiscoverResult {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: "movie" | "tv";
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
  genreIds?: number[];
  mediaInfo?: { status: number };
  popularity?: number;
}

interface JellyseerrDiscoverResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: JellyseerrDiscoverResult[];
}

// TMDB genre ID to name mapping
const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const TMDB_TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

function mapStatus(mediaInfo?: {
  status: number;
}): "available" | "requested" | "pending" | "unavailable" {
  if (!mediaInfo) {
    return "unavailable";
  }
  switch (mediaInfo.status) {
    case MediaStatus.AVAILABLE:
      return "available";
    case MediaStatus.PENDING:
    case MediaStatus.PROCESSING:
      return "requested";
    case MediaStatus.PARTIALLY_AVAILABLE:
      return "pending";
    default:
      return "unavailable";
  }
}

function parseYear(
  releaseDate?: string,
  firstAirDate?: string
): number | undefined {
  const dateStr = releaseDate?.slice(0, 4) ?? firstAirDate?.slice(0, 4);
  if (!dateStr) {
    return undefined;
  }
  const year = Number.parseInt(dateStr, 10);
  return year > 0 ? year : undefined;
}

function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

// Category configurations
type CategoryType = "trending" | "movies" | "tv" | "genre";

interface CategoryConfig {
  type: CategoryType;
  genreId?: number;
  mediaType?: "movie" | "tv";
}

function parseCategorySlug(slug: string): CategoryConfig | null {
  if (slug === "trending") {
    return { type: "trending" };
  }
  // Support both "movies" and "popular-movies" (from main discover page)
  if (slug === "movies" || slug === "popular-movies") {
    return { type: "movies", mediaType: "movie" };
  }
  // Support both "tv" and "popular-tv" (from main discover page)
  if (slug === "tv" || slug === "popular-tv") {
    return { type: "tv", mediaType: "tv" };
  }
  // Genre format: genre:{id} or genre:{id}:{mediaType}
  if (slug.startsWith("genre:")) {
    const parts = slug.split(":");
    const genreId = Number.parseInt(parts[1], 10);
    if (Number.isNaN(genreId)) {
      return null;
    }
    const mediaType = parts[2] as "movie" | "tv" | undefined;
    return { type: "genre", genreId, mediaType };
  }
  return null;
}

function getEndpointForCategory(
  config: CategoryConfig,
  page: number
): { endpoint: string; params: Record<string, string | number> } {
  const params: Record<string, string | number> = { page };

  switch (config.type) {
    case "trending":
      return { endpoint: "/discover/trending", params };
    case "movies":
      return { endpoint: "/discover/movies", params };
    case "tv":
      return { endpoint: "/discover/tv", params };
    case "genre":
      if (config.genreId === undefined) {
        return { endpoint: "/discover/trending", params };
      }
      if (config.mediaType === "tv") {
        params.genre = config.genreId;
        return { endpoint: `/discover/tv/genre/${config.genreId}`, params };
      }
      // Default to movies for genre
      params.genre = config.genreId;
      return { endpoint: `/discover/movies/genre/${config.genreId}`, params };
    default:
      return { endpoint: "/discover/trending", params };
  }
}

function getCategoryTitle(config: CategoryConfig): string {
  switch (config.type) {
    case "trending":
      return "Trending Now";
    case "movies":
      return "Popular Movies";
    case "tv":
      return "Popular TV Shows";
    case "genre": {
      if (config.genreId === undefined) {
        return "Discover";
      }
      const genreMap =
        config.mediaType === "tv" ? TMDB_TV_GENRES : TMDB_MOVIE_GENRES;
      const genreName = genreMap[config.genreId] || "Genre";
      const suffix = config.mediaType === "tv" ? "TV Shows" : "Movies";
      return `${genreName} ${suffix}`;
    }
    default:
      return "Discover";
  }
}

// Available filter options
const DECADES = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "Older"];
const RATINGS = ["9+", "8+", "7+", "6+", "Any"];
const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating" },
  { value: "year_desc", label: "Newest First" },
  { value: "year_asc", label: "Oldest First" },
  { value: "title", label: "A-Z" },
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const sort = searchParams.get("sort") ?? "popularity";
  const decade = searchParams.get("decade");
  const minRating = searchParams.get("rating");

  if (!slug) {
    return NextResponse.json(
      { error: "Category slug is required" },
      { status: 400 }
    );
  }

  const categoryConfig = parseCategorySlug(slug);
  if (!categoryConfig) {
    return NextResponse.json(
      { error: "Invalid category slug" },
      { status: 400 }
    );
  }

  const jellyseerrConfig = await getServiceConfig({
    userId: session.user.id,
    serviceName: "jellyseerr",
  });

  if (!jellyseerrConfig?.isEnabled) {
    return NextResponse.json(
      { error: "Jellyseerr not configured" },
      { status: 400 }
    );
  }

  const client = new JellyseerrClient(jellyseerrConfig);

  try {
    const { endpoint, params } = getEndpointForCategory(categoryConfig, page);

    const response = await client.get<JellyseerrDiscoverResponse>(
      endpoint,
      params
    );

    // Transform and filter results
    let items = response.results.map((item) => {
      const year = parseYear(item.releaseDate, item.firstAirDate);
      const genreMap =
        item.mediaType === "tv" ? TMDB_TV_GENRES : TMDB_MOVIE_GENRES;

      return {
        id: item.id,
        title: item.title ?? item.name ?? "Unknown",
        year,
        decade: year ? getDecade(year) : undefined,
        posterUrl: item.posterPath
          ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
          : null,
        rating: item.voteAverage,
        mediaType: item.mediaType,
        tmdbId: item.id,
        status: mapStatus(item.mediaInfo),
        genres: (item.genreIds ?? []).map((id) => genreMap[id]).filter(Boolean),
        popularity: item.popularity,
      };
    });

    // Apply client-side filters
    if (decade && decade !== "Any") {
      if (decade === "Older") {
        items = items.filter((item) => item.year && item.year < 1970);
      } else {
        items = items.filter((item) => item.decade === decade);
      }
    }

    if (minRating && minRating !== "Any") {
      const ratingNum = Number.parseInt(minRating.replace("+", ""), 10);
      items = items.filter((item) => item.rating && item.rating >= ratingNum);
    }

    // Apply sorting
    switch (sort) {
      case "rating":
        items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "year_desc":
        items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case "year_asc":
        items.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
        break;
      case "title":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Already sorted by popularity from API
        break;
    }

    return NextResponse.json({
      title: getCategoryTitle(categoryConfig),
      items,
      page: response.page,
      totalPages: response.totalPages,
      totalResults: response.totalResults,
      filters: {
        decades: DECADES,
        ratings: RATINGS,
        sortOptions: SORT_OPTIONS,
      },
      currentFilters: {
        decade,
        rating: minRating,
        sort,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch category content" },
      { status: 500 }
    );
  }
}
