import Link from "next/link";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  getSubcategoriesByCategory,
} from "@/lib/catalog-api";

interface CategoryPageProps {
  params: {
    categorySlug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = params;

  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Категория не найдена</h1>
        <p className="text-muted-foreground">
          Возможно, она ещё не создана в Supabase.
        </p>
      </main>
    );
  }

  const [subcategories, products] = await Promise.all([
    getSubcategoriesByCategory(category.id),
    getProductsByCategorySlug(category.slug),
  ]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <Link href="/catalog" className="hover:underline">
            Каталог
          </Link>{" "}
          / <span>{category.name}</span>
        </div>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        {category.description && (
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      {subcategories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Подкатегории</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/catalog/${category.slug}/${sub.slug}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Товары категории</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="flex flex-col rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
              >
                <div className="mb-3 overflow-hidden rounded-md border bg-muted flex h-32 items-center justify-center">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Нет изображения
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-semibold text-muted-foreground">
                    Товар
                  </div>
                  <div className="font-medium">{product.name}</div>
                  {product.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.short_description}
                    </p>
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold">
                  {product.price.toLocaleString("ru-RU")} ₽
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {subcategories.length === 0 && products.length === 0 && (
        <p className="text-muted-foreground">
          Для этой категории ещё нет подкатегорий или товаров.
        </p>
      )}
    </main>
  );
}
