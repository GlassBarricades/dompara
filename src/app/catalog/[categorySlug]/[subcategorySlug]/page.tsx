import Link from "next/link";
import {
  getCategoryBySlug,
  getProductsBySubcategorySlug,
} from "@/lib/catalog-api";

interface SubcategoryPageProps {
  params: {
    categorySlug: string;
    subcategorySlug: string;
  };
}

export default async function SubcategoryPage({
  params,
}: SubcategoryPageProps) {
  const { categorySlug, subcategorySlug } = params;

  const category = await getCategoryBySlug(categorySlug);
  const products = await getProductsBySubcategorySlug(subcategorySlug);

  if (!category) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Категория не найдена</h1>
      </main>
    );
  }

  const subcategoryName = decodeURIComponent(subcategorySlug);

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="text-sm text-muted-foreground">
          <Link href="/catalog" className="hover:underline">
            Каталог
          </Link>{" "}
          /{" "}
          <Link
            href={`/catalog/${category.slug}`}
            className="hover:underline"
          >
            {category.name}
          </Link>{" "}
          / <span>{subcategoryName}</span>
        </div>
        <h1 className="text-2xl font-semibold">{subcategoryName}</h1>
      </header>

      {products.length > 0 ? (
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
      ) : (
        <p className="text-muted-foreground">
          В этой подкатегории пока нет активных товаров.
        </p>
      )}
    </main>
  );
}
