import Link from "next/link";
import {
  getCategoryBySlug,
  getProductsBySubcategorySlug,
  getCatalogTree,
  getFilterableAttributesAndValues,
} from "@/lib/catalog-api";
import { CatalogWithSidebar } from "@/components/catalog/catalog-with-sidebar";

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
  const [products, tree] = await Promise.all([
    getProductsBySubcategorySlug(subcategorySlug),
    getCatalogTree(),
  ]);

  if (!category) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Категория не найдена</h1>
      </main>
    );
  }

  const subcategoryName = decodeURIComponent(subcategorySlug);

  const { attributes: filterAttributes, values: attributeValues } =
    await getFilterableAttributesAndValues(
      category.id,
      subcategorySlug,
      products.map((p) => p.id)
    );

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <CatalogWithSidebar
        header={
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
        }
        tree={tree}
        products={products}
        filterAttributes={filterAttributes}
        attributeValues={attributeValues}
        activeCategorySlug={category.slug}
        activeSubcategorySlug={subcategorySlug}
      />

      {products.length === 0 && (
        <p className="text-muted-foreground">
          В этой подкатегории пока нет активных товаров.
        </p>
      )}
    </main>
  );
}
