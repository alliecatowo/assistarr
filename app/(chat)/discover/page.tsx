import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { DiscoverProvider } from "@/components/discover/discover-context";
import { DiscoverShell } from "@/components/discover/discover-shell";
import { fetchDiscoverySections } from "@/lib/discover/fetch-discovery-sections";
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
