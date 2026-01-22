import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import {
  DiscoverProvider,
  type DiscoverSection,
} from "@/components/discover/discover-context";
import { DiscoverShell } from "@/components/discover/discover-shell";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { MediaStatus } from "@/lib/plugins/jellyseerr/types";
import { getPosterUrl } from "@/lib/utils";
import DiscoverLoading from "./loading";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverLoading />}>
      <DiscoverContent />
    </Suspense>
  );
}

async function DiscoverContent() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch discovery content (trending, popular from TMDB via Jellyseerr)
  const initialSections = await fetchDiscoverySections(session.user.id);

  return (
    <DiscoverProvider initialSections={initialSections}>
      <DiscoverShell userId={session.user.id} />
    </DiscoverProvider>
  );
}

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
  mediaInfo?: { status: number };
}

interface JellyseerrDiscoverResponse {
  results: JellyseerrDiscoverResult[];
}

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

async function fetchDiscoverySections(
  userId: string
): Promise<DiscoverSection[]> {
  try {
    const config = await getServiceConfig({
      userId,
      serviceName: "jellyseerr",
    });

    if (!config?.isEnabled) {
      return [];
    }

    const client = new JellyseerrClient(config);
    const sections: DiscoverSection[] = [];

    // Fetch multiple sections in parallel for a rich discover experience
    // Note: Only using working Jellyseerr API endpoints
    const [trendingRes, moviesRes, tvRes, upcomingRes] =
      await Promise.allSettled([
        client.get<JellyseerrDiscoverResponse>("/discover/trending"),
        client.get<JellyseerrDiscoverResponse>("/discover/movies"),
        client.get<JellyseerrDiscoverResponse>("/discover/tv"),
        client.get<JellyseerrDiscoverResponse>("/discover/movies/upcoming"),
      ]);

    if (
      trendingRes.status === "fulfilled" &&
      trendingRes.value.results?.length
    ) {
      sections.push({
        id: "trending",
        title: "Trending Now",
        items: trendingRes.value.results.slice(0, 15).map((item) => ({
          id: item.id,
          title: item.title ?? item.name ?? "Unknown",
          year:
            Number.parseInt(
              item.releaseDate?.slice(0, 4) ??
                item.firstAirDate?.slice(0, 4) ??
                "0",
              10
            ) || undefined,
          posterUrl: getPosterUrl(item.posterPath),
          rating: item.voteAverage,
          mediaType: item.mediaType,
          tmdbId: item.id,
          status: mapStatus(item.mediaInfo),
        })),
      });
    }

    if (moviesRes.status === "fulfilled" && moviesRes.value.results?.length) {
      sections.push({
        id: "popular-movies",
        title: "Popular Movies",
        items: moviesRes.value.results.slice(0, 15).map((item) => ({
          id: item.id,
          title: item.title ?? item.name ?? "Unknown",
          year:
            Number.parseInt(
              item.releaseDate?.slice(0, 4) ??
                item.firstAirDate?.slice(0, 4) ??
                "0",
              10
            ) || undefined,
          posterUrl: getPosterUrl(item.posterPath),
          rating: item.voteAverage,
          mediaType: "movie" as const,
          tmdbId: item.id,
          status: mapStatus(item.mediaInfo),
        })),
      });
    }

    if (tvRes.status === "fulfilled" && tvRes.value.results?.length) {
      sections.push({
        id: "popular-tv",
        title: "Popular TV Shows",
        items: tvRes.value.results.slice(0, 15).map((item) => ({
          id: item.id,
          title: item.title ?? item.name ?? "Unknown",
          year:
            Number.parseInt(
              item.releaseDate?.slice(0, 4) ??
                item.firstAirDate?.slice(0, 4) ??
                "0",
              10
            ) || undefined,
          posterUrl: getPosterUrl(item.posterPath),
          rating: item.voteAverage,
          mediaType: "tv" as const,
          tmdbId: item.id,
          status: mapStatus(item.mediaInfo),
        })),
      });
    }

    if (
      upcomingRes.status === "fulfilled" &&
      upcomingRes.value.results?.length
    ) {
      sections.push({
        id: "upcoming-movies",
        title: "Coming Soon",
        items: upcomingRes.value.results.slice(0, 15).map((item) => ({
          id: item.id,
          title: item.title ?? item.name ?? "Unknown",
          year:
            Number.parseInt(
              item.releaseDate?.slice(0, 4) ??
                item.firstAirDate?.slice(0, 4) ??
                "0",
              10
            ) || undefined,
          posterUrl: getPosterUrl(item.posterPath),
          rating: item.voteAverage,
          mediaType: "movie" as const,
          tmdbId: item.id,
          status: mapStatus(item.mediaInfo),
        })),
      });
    }

    return sections;
  } catch (_error) {
    return [];
  }
}
