import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ServiceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-5 w-16" />
      </CardContent>
    </Card>
  );
}

function QueueWidgetSkeleton() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="space-y-2 py-3 border-b last:border-b-0" key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SidebarWidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="flex items-center justify-between py-3 border-b last:border-b-0"
            key={i}
          >
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MonitorLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </header>

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Service Status Grid */}
          <section>
            <Skeleton className="mb-4 h-4 w-16" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <QueueWidgetSkeleton />
            <div className="space-y-6">
              <SidebarWidgetSkeleton />
              <SidebarWidgetSkeleton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
