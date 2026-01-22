import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { BrowseView } from "@/components/discover/browse-view";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function CategoryLoading() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
        <Skeleton className="size-8" />
        <Skeleton className="h-6 w-48" />
      </header>
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => {
            const id = `skeleton-${String(i).padStart(3, "0")}`;
            return (
              <div className="space-y-2" key={id}>
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { slug } = await params;

  // Decode the slug in case it contains special characters
  const decodedSlug = decodeURIComponent(slug);

  return (
    <Suspense fallback={<CategoryLoading />}>
      <BrowseView slug={decodedSlug} />
    </Suspense>
  );
}
