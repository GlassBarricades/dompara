import { supabase } from "./supabase-client";

export interface PageContent {
  id: string;
  page_key: string;
  title: string;
  content_html: string;
  updated_at: string;
}

export async function getPageContent(pageKey: string): Promise<PageContent | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("id, page_key, title, content_html, updated_at")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (error) {
      console.error("Failed to load page content", error);
      return null;
    }

    return data as PageContent | null;
  } catch (error) {
    console.error("Failed to load page content", error);
    return null;
  }
}

export async function getAllPageContent(): Promise<PageContent[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("id, page_key, title, content_html, updated_at")
      .order("page_key", { ascending: true });

    if (error) {
      console.error("Failed to load page content", error);
      return [];
    }

    return (data ?? []) as PageContent[];
  } catch (error) {
    console.error("Failed to load page content", error);
    return [];
  }
}
