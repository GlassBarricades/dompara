export default function SubcategoryLoading() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-[260px,minmax(0,1fr)]">
        {/* Sidebar skeleton */}
        <aside className="space-y-4">
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </div>
        </aside>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-lg border bg-background p-4 space-y-3"
              >
                <div className="h-56 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
