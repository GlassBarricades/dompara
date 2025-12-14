import { MetadataRoute } from "next";
import { getCategories } from "@/lib/catalog-api";
import { supabase } from "@/lib/supabase-client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/delivery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Добавляем категории
  try {
    const categories = await getCategories();
    categories.forEach((category) => {
      routes.push({
        url: `${baseUrl}/catalog/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // Добавляем товары (если Supabase настроен)
    if (supabase) {
      const { data: products } = await supabase
        .from("products")
        .select("slug, category_id, updated_at")
        .eq("is_active", true)
        .limit(1000); // Ограничиваем для производительности

      if (products) {
        // Получаем категории для товаров
        const categoryMap = new Map(categories.map((c) => [c.id, c.slug]));

        products.forEach((product) => {
          const categorySlug = categoryMap.get(product.category_id);
          if (categorySlug) {
            routes.push({
              url: `${baseUrl}/product/${product.slug}`,
              lastModified: product.updated_at
                ? new Date(product.updated_at)
                : new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return routes;
}

