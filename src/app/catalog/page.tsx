import Link from "next/link";
import { getCategories } from "@/lib/catalog-api";

// Делаем страницу каталога динамической,
// чтобы список категорий не кэшировался на билд,
// а подхватывал изменения из админки сразу.
export const revalidate = 0;

export default async function CatalogPage() {
  const categories = await getCategories();

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Каталог товаров для бани</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Выберите раздел: печи, камни, веники или аксессуары. Для каждой категории
          доступны свои подкатегории и набор характеристик.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">
          Категории пока не настроены или Supabase не подключён. После настройки
          БД здесь появится список разделов каталога.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <li 
              key={category.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "both",
              }}
            >
              <Link
                href={`/catalog/${category.slug}`}
                className="flex h-full flex-col rounded-lg border bg-background p-4 transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-[1.02]"
              >
                <div className="mb-3 overflow-hidden rounded-md border bg-muted flex h-32 items-center justify-center">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Нет изображения
                    </span>
                  )}
                </div>
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Категория
                </div>
                <h2 className="text-lg font-semibold">{category.name}</h2>
                {category.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                    {category.description}
                  </p>
                )}
                <span className="mt-3 text-xs text-primary underline-offset-4 hover:underline">
                  Перейти к товарам
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
