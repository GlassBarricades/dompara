import {
  getProductBySlug,
  getProductAttributesForDisplay,
  getSimilarProducts,
} from "@/lib/catalog-api";
import { getProductReviews } from "@/lib/reviews-api";
import { ProductPageInner } from "./product-page-inner";

interface ProductPageProps {
  params: {
    productSlug: string;
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

  const [attributes, similarProducts, reviews] = await Promise.all([
    getProductAttributesForDisplay(
      product.id,
      product.category_id,
      product.subcategory_id
    ),
    getSimilarProducts(product.id, product.category_id, 4),
    getProductReviews(product.id),
  ]);

  return (
    <ProductPageInner
      product={product}
      attributes={attributes}
      similarProducts={similarProducts}
      reviews={reviews}
    />
  );
}
