import { supabase } from "./supabase-client";

export interface Review {
  id: string;
  // product_id может быть null для общих отзывов
  // Если товар удален, product_id остается в отзыве, но товар не будет найден
  // Это позволяет сохранить историю отзывов даже после удаления товара
  product_id: string | null;
  customer_name: string;
  customer_photo_url: string | null;
  rating: number; // 1-5
  text: string;
  sort_order: number;
  is_active: boolean;
  show_on_homepage: boolean; // Флаг для отображения на главной странице
  created_at: string;
  // Дополнительные поля при join с products
  product_name?: string | null;
  product_slug?: string | null;
}

export async function getActiveReviews(): Promise<Review[]> {
  if (!supabase) return [];

  try {
    // Получаем отзывы для главной страницы (с флагом show_on_homepage = true)
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, product_id, customer_name, customer_photo_url, rating, text, sort_order, is_active, show_on_homepage, created_at")
      .eq("is_active", true)
      .eq("show_on_homepage", true)
      .order("sort_order", { ascending: true });

    if (reviewsError) throw reviewsError;

    // Собираем уникальные product_id
    const productIds = (reviewsData ?? [])
      .map((r: any) => r.product_id)
      .filter((id: string | null): id is string => !!id);

    // Загружаем товары, если есть привязанные
    let productsMap = new Map<string, { id: string; name: string; slug: string }>();
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, slug")
        .in("id", productIds);

      if (!productsError && productsData) {
        productsData.forEach((p: any) => {
          productsMap.set(p.id, p);
        });
      }
    }

    // Объединяем данные
    return (reviewsData ?? []).map((review: any) => ({
      ...review,
      product_name: review.product_id ? productsMap.get(review.product_id)?.name || null : null,
      product_slug: review.product_id ? productsMap.get(review.product_id)?.slug || null : null,
    })) as Review[];
  } catch (error) {
    console.error("Failed to load reviews", error);
    return [];
  }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!supabase) return [];

  try {
    // Получаем отзывы, привязанные к конкретному товару
    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, customer_name, customer_photo_url, rating, text, sort_order, is_active, show_on_homepage, created_at")
      .eq("is_active", true)
      .eq("product_id", productId);

    if (error) {
      console.error("Failed to load product reviews", error);
      return [];
    }

    // Сортируем: сначала по sort_order (по возрастанию), затем по created_at (по убыванию)
    const reviews = (data ?? []) as Review[];
    return reviews.sort((a, b) => {
      // Сначала сравниваем по sort_order
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      // Если sort_order одинаковый, сортируем по дате создания (новые первыми)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } catch (error) {
    console.error("Failed to load product reviews", error);
    return [];
  }
}

