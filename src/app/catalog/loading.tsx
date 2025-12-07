export default function CatalogLoading() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border bg-background p-4 space-y-3"
          >
            <div className="h-32 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
