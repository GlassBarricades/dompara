import { supabase } from "./supabase-client";

export interface Review {
  id: string;
  customer_name: string;
  customer_photo_url: string | null;
  rating: number; // 1-5
  text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function getActiveReviews(): Promise<Review[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, customer_photo_url, rating, text, sort_order, is_active, created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load reviews", error);
    return [];
  }

  return (data ?? []) as Review[];
}

