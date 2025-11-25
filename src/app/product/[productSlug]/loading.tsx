export default function ProductLoading() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr),minmax(0,1.5fr)]">
        {/* Левая колонка: скелетон описания */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
              <div className="h-6 w-28 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between gap-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка: скелетон галереи и карточки */}
        <aside className="space-y-4 rounded-lg border bg-background p-4">
          <div className="space-y-2">
            <div className="h-[420px] w-full bg-muted animate-pulse rounded-md" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-24 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <div className="h-3 w-12 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

