import { NextRequest, NextResponse } from "next/server";
import {
  getProductBySlug,
  getProductAttributesForDisplay,
} from "@/lib/catalog-api";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await getProductBySlug(params.slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Загружаем атрибуты товара
    const attributes = await getProductAttributesForDisplay(
      product.id,
      product.category_id,
      product.subcategory_id
    );

    return NextResponse.json({
      product,
      attributes,
    });
  } catch (error) {
    console.error("Failed to load product", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}
