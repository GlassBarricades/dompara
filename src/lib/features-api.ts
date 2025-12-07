import { supabase } from "./supabase-client";

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function getActiveFeatures(): Promise<Feature[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("features")
      .select("id, icon, title, description, sort_order, is_active, created_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to load features", error);
      return [];
    }

    return (data ?? []) as Feature[];
  } catch (error) {
    console.error("Failed to load features", error);
    return [];
  }
}
