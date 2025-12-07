import Link from "next/link";
import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getProductsBySubcategorySlug,
  getCatalogTree,
  getFilterableAttributesAndValues,
} from "@/lib/catalog-api";
import { CatalogWithSidebar } from "@/components/catalog/catalog-with-sidebar";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";

// Делаем страницу подкатегории динамической,
// чтобы список товаров всегда был свежим.
export const revalidate = 0;

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
  const [subcategory, products, tree] = await Promise.all([
    getSubcategoryBySlug(subcategorySlug),
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

  const subcategoryName = subcategory?.name || decodeURIComponent(subcategorySlug);

  const { attributes: filterAttributes, values: attributeValues } =
    await getFilterableAttributesAndValues(
      category.id,
      subcategorySlug,
      products.map((p) => p.id)
    );

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: category.name, href: `/catalog/${category.slug}` },
          { label: subcategoryName },
        ]}
      />
      <CatalogWithSidebar
        header={
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">{subcategoryName}</h1>
          </header>
        }
        tree={tree}
        products={products}
        filterAttributes={filterAttributes}
        attributeValues={attributeValues}
        activeCategorySlug={category.slug}
        activeSubcategorySlug={subcategorySlug}
        verticalCardLayout={subcategory?.vertical_card_layout || false}
      />

      {products.length === 0 && (
        <p className="text-muted-foreground">
          В этой подкатегории пока нет активных товаров.
        </p>
      )}
    </main>
  );
}
