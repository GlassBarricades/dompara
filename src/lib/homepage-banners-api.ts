import { supabase } from "./supabase-client";

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("homepage_banners")
    .select(
      "id, title, subtitle, description, image_url, link_url, button_text, sort_order, is_active",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load homepage banners", error);
    return [];
  }

  return (data ?? []) as HomepageBanner[];
}


