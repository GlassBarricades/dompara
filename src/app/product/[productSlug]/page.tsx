import type { Metadata } from "next";
import {
  getProductBySlug,
  getProductAttributesForDisplay,
  getSimilarProducts,
  getCategoryById,
  getSubcategoryById,
} from "@/lib/catalog-api";
import { getProductReviews } from "@/lib/reviews-api";
import { ProductPageInner } from "./product-page-inner";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/catalog/breadcrumbs";

interface ProductPageProps {
  params: {
    productSlug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.productSlug);

  if (!product) {
    return {
      title: "Товар не найден",
    };
  }

  const title = `${product.name} | Магазин для бани`;
  const description =
    product.short_description ||
    `Купить ${product.name} в интернет-магазине товаров для бани. Цена: ${product.price} BYN.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.main_image_url
        ? [
            {
              url: product.main_image_url,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.main_image_url ? [product.main_image_url] : [],
    },
  };
}

// Серверный компонент для загрузки данных
export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.productSlug);

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Товар не найден</h1>
        <p className="text-muted-foreground">
          Возможно, он ещё не создан или скрыт в каталоге.
        </p>
      </main>
    );
  }

  const [attributes, similarProducts, reviews, category, subcategory] =
    await Promise.all([
      getProductAttributesForDisplay(
        product.id,
        product.category_id,
        product.subcategory_id
      ),
      getSimilarProducts(product.id, product.category_id, 4),
      getProductReviews(product.id),
      getCategoryById(product.category_id),
      product.subcategory_id
        ? getSubcategoryById(product.subcategory_id)
        : Promise.resolve(null),
    ]);

  const breadcrumbsItems: BreadcrumbItem[] = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
  ];

  if (category) {
    breadcrumbsItems.push({
      label: category.name,
      href: `/catalog/${category.slug}`,
    });
  }

  if (subcategory) {
    breadcrumbsItems.push({
      label: subcategory.name,
      href: `/catalog/${category!.slug}/${subcategory.slug}`,
    });
  }

  breadcrumbsItems.push({ label: product.name });

  return (
    <>
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>
      <ProductPageInner
        product={product}
        attributes={attributes}
        similarProducts={similarProducts}
        reviews={reviews}
      />
    </>
  );
}
