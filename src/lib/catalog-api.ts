import { supabase } from "./supabase-client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface Product {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  main_image_url: string | null;
  gallery: string[] | null;
}

export type AttributeDataType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect";

export interface ProductAttributeDisplay {
  id: string;
  name: string;
  slug: string;
  unit: string | null;
  data_type: AttributeDataType;
  value: any;
  options: any | null;
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load categories", error);
    return [];
  }

  return data ?? [];
}

export async function getCategoryBySlug(slug: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load category", error);
    return null;
  }

  return data as Category | null;
}

export async function getSubcategoriesByCategory(categoryId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, name, slug, description, image_url")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load subcategories", error);
    return [];
  }

  return data as Subcategory[];
}

export async function getProductsByCategorySlug(slug: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active"
    )
    .eq("is_active", true)
    .eq("category_slug", slug);

  if (error) {
    console.error("Failed to load products by category", error);
    return [];
  }

  return (data ?? []) as (Product & { is_active: boolean })[];
}

export async function getProductsBySubcategorySlug(slug: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active"
    )
    .eq("is_active", true)
    .eq("subcategory_slug", slug);

  if (error) {
    console.error("Failed to load products by subcategory", error);
    return [];
  }

  return (data ?? []) as (Product & { is_active: boolean })[];
}

export async function getProductBySlug(slug: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load product", error);
    return null;
  }

  if (!data || !(data as { is_active: boolean }).is_active) {
    return null;
  }

  const { is_active, ...rest } = data as Product & { is_active: boolean };
  return rest;
}

export async function getProductAttributesForDisplay(
  productId: string,
  categoryId: string,
  subcategoryId: string | null
): Promise<ProductAttributeDisplay[]> {
  if (!supabase) return [];

  // получаем назначения характеристик для категории, подкатегории и товара
  const [catRes, subRes, prodRes, defsRes, valuesRes] = await Promise.all([
    supabase
      .from("attribute_assignments")
      .select(
        "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
      )
      .eq("scope_type", "category")
      .eq("scope_id", categoryId),
    subcategoryId
      ? supabase
          .from("attribute_assignments")
          .select(
            "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
          )
          .eq("scope_type", "subcategory")
          .eq("scope_id", subcategoryId)
      : Promise.resolve({ data: [], error: null } as any),
    supabase
      .from("attribute_assignments")
      .select(
        "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
      )
      .eq("scope_type", "product")
      .eq("scope_id", productId),
    supabase
      .from("attribute_definitions")
      .select("id, name, slug, data_type, unit, options"),
    supabase
      .from("product_attribute_values")
      .select("attribute_id, value")
      .eq("product_id", productId),
  ]);

  if (catRes.error) {
    console.error(catRes.error);
    return [];
  }
  if (subRes.error) {
    console.error(subRes.error);
    return [];
  }
  if (prodRes.error) {
    console.error(prodRes.error);
    return [];
  }
  if (defsRes.error) {
    console.error(defsRes.error);
    return [];
  }
  if (valuesRes.error) {
    console.error(valuesRes.error);
    return [];
  }

  type ScopeType = "category" | "subcategory" | "product";
  interface AssignmentRow {
    id: string;
    attribute_id: string;
    scope_type: ScopeType;
    scope_id: string;
    is_required: boolean;
    is_filterable: boolean;
    sort_order: number;
  }

  const map = new Map<string, { assignment: AssignmentRow; source: ScopeType }>();

  for (const a of catRes.data ?? []) {
    const assign = a as AssignmentRow;
    map.set(assign.attribute_id, { assignment: assign, source: "category" });
  }
  for (const a of subRes.data ?? []) {
    const assign = a as AssignmentRow;
    map.set(assign.attribute_id, { assignment: assign, source: "subcategory" });
  }
  for (const a of prodRes.data ?? []) {
    const assign = a as AssignmentRow;
    map.set(assign.attribute_id, { assignment: assign, source: "product" });
  }

  const defs = (defsRes.data ?? []) as {
    id: string;
    name: string;
    slug: string;
    data_type: AttributeDataType;
    unit: string | null;
    options: any | null;
  }[];

  const defsById = new Map<string, (typeof defs)[number]>();
  defs.forEach((d) => defsById.set(d.id, d));

  const valuesByAttr = new Map<string, any>();
  for (const row of valuesRes.data ?? []) {
    valuesByAttr.set((row as any).attribute_id, (row as any).value);
  }

  const result: ProductAttributeDisplay[] = [];

  map.forEach(({ assignment }, attributeId) => {
    const def = defsById.get(attributeId);
    if (!def) return;
    const raw = valuesByAttr.get(attributeId);

    result.push({
      id: def.id,
      name: def.name,
      slug: def.slug,
      unit: def.unit,
      data_type: def.data_type,
      options: def.options,
      value: raw ?? null,
    });
  });

  result.sort((a, b) => {
    const aOrder =
      (map.get(a.id)?.assignment.sort_order ?? 0);
    const bOrder =
      (map.get(b.id)?.assignment.sort_order ?? 0);
    return aOrder - bOrder;
  });

  return result;
}


