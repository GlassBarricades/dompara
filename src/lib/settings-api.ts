import { supabase } from "@/lib/supabase-client";

export interface ContactSettings {
  id: string;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  address: string | null;
  showroom_hours: string | null;
  company_name: string | null;
  requisites: string | null;
  logo_url: string | null;
  map_latitude: number | null;
  map_longitude: number | null;
  map_zoom: number | null;
}

export async function getContactSettings(): Promise<ContactSettings | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("contact_settings")
    .select(
      "id, phone, email, telegram, address, showroom_hours, company_name, requisites, logo_url, map_latitude, map_longitude, map_zoom"
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load contact settings", error);
    return null;
  }

  return data as ContactSettings | null;
}


