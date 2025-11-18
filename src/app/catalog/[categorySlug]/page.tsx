import Link from "next/link";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  getSubcategoriesByCategory,
  getCatalogTree,
  getFilterableAttributesAndValues,
} from "@/lib/catalog-api";
import { CatalogWithSidebar } from "@/components/catalog/catalog-with-sidebar";

// Делаем страницу категории динамической,
// чтобы список товаров и подкатегорий всегда был актуальным.
export const revalidate = 0;

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

  const [subcategories, products, tree] = await Promise.all([
    getSubcategoriesByCategory(category.id),
    getProductsByCategorySlug(category.slug),
    getCatalogTree(),
  ]);

  const { attributes: filterAttributes, values: attributeValues } =
    await getFilterableAttributesAndValues(
      category.id,
      null,
      products.map((p) => p.id)
    );

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <CatalogWithSidebar
        header={
          <header className="space-y-3">
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

            {subcategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-medium text-muted-foreground">
                  Подкатегории:
                </span>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/catalog/${category.slug}/${sub.slug}`}
                      className="rounded-full border px-3 py-1 hover:bg-accent hover:text-accent-foreground"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </header>
        }
        tree={tree}
        products={products}
        filterAttributes={filterAttributes}
        attributeValues={attributeValues}
        activeCategorySlug={category.slug}
      />

      {subcategories.length === 0 && products.length === 0 && (
        <p className="text-muted-foreground">
          Для этой категории ещё нет подкатегорий или товаров.
        </p>
      )}
    </main>
  );
}
