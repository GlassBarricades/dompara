import { supabase } from "./supabase-client";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActiveFAQItems(): Promise<FAQItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("faq_items")
      .select("id, question, answer, sort_order, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to load FAQ items", error);
      return [];
    }

    return (data ?? []) as FAQItem[];
  } catch (error) {
    console.error("Failed to load FAQ items", error);
    return [];
  }
}
