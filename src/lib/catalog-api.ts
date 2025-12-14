import { supabase } from "./supabase-client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  vertical_card_layout?: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  vertical_card_layout?: boolean;
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
  stock_quantity?: number | null;
  is_custom_order?: boolean;
  is_featured?: boolean;
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

export interface CatalogCategoryNode extends Category {
  subcategories: Subcategory[];
}

export interface FilterableAttributeDefinition {
  id: string;
  name: string;
  slug: string;
  data_type: AttributeDataType;
  unit: string | null;
  options: any | null;
}

export interface ProductAttributeValueRow {
  product_id: string;
  attribute_id: string;
  value: any;
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, vertical_card_layout")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load categories", error);
    return [];
  }

  return data ?? [];
}

export async function getCatalogTree(): Promise<CatalogCategoryNode[]> {
  if (!supabase) return [];

  const [catRes, subRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url, vertical_card_layout")
      .order("sort_order", { ascending: true }),
    supabase
      .from("subcategories")
      .select("id, category_id, name, slug, description, image_url, vertical_card_layout")
      .order("sort_order", { ascending: true }),
  ]);

  if (catRes.error) {
    console.error("Failed to load categories for tree", catRes.error);
    return [];
  }
  if (subRes.error) {
    console.error("Failed to load subcategories for tree", subRes.error);
    return [];
  }

  const categories = (catRes.data ?? []) as Category[];
  const subcategories = (subRes.data ?? []) as Subcategory[];

  const subByCat = new Map<string, Subcategory[]>();
  for (const sub of subcategories) {
    const list = subByCat.get(sub.category_id) ?? [];
    list.push(sub);
    subByCat.set(sub.category_id, list);
  }

  return categories.map((cat) => ({
    ...cat,
    subcategories: subByCat.get(cat.id) ?? [],
  }));
}

export async function getFilterableAttributesAndValues(
  categoryId: string,
  subcategoryId: string | null,
  productIds: string[]
): Promise<{
  attributes: FilterableAttributeDefinition[];
  values: ProductAttributeValueRow[];
}> {
  if (!supabase) return { attributes: [], values: [] };
  if (productIds.length === 0) return { attributes: [], values: [] };

  type ScopeType = "category" | "subcategory";
  interface AssignmentRow {
    id: string;
    attribute_id: string;
    scope_type: ScopeType;
    scope_id: string;
    is_required: boolean;
    is_filterable: boolean;
    sort_order: number;
  }

  const [catRes, subRes] = await Promise.all([
    supabase
      .from("attribute_assignments")
      .select(
        "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
      )
      .eq("scope_type", "category")
      .eq("scope_id", categoryId)
      .eq("is_filterable", true),
    subcategoryId
      ? supabase
          .from("attribute_assignments")
          .select(
            "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
          )
          .eq("scope_type", "subcategory")
          .eq("scope_id", subcategoryId)
          .eq("is_filterable", true)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (catRes.error) {
    console.error(
      "Failed to load category filterable attributes",
      catRes.error
    );
    return { attributes: [], values: [] };
  }
  if (subRes.error) {
    console.error(
      "Failed to load subcategory filterable attributes",
      subRes.error
    );
    return { attributes: [], values: [] };
  }

  const map = new Map<string, AssignmentRow>();
  for (const a of catRes.data ?? []) {
    const assign = a as AssignmentRow;
    map.set(assign.attribute_id, assign);
  }
  for (const a of subRes.data ?? []) {
    const assign = a as AssignmentRow;
    map.set(assign.attribute_id, assign);
  }

  const attributeIds = Array.from(map.keys());
  if (attributeIds.length === 0) {
    return { attributes: [], values: [] };
  }

  const [defsRes, valuesRes] = await Promise.all([
    supabase
      .from("attribute_definitions")
      .select("id, name, slug, data_type, unit, options")
      .in("id", attributeIds),
    supabase
      .from("product_attribute_values")
      .select("product_id, attribute_id, value")
      .in("product_id", productIds)
      .in("attribute_id", attributeIds),
  ]);

  if (defsRes.error) {
    console.error(
      "Failed to load filterable attribute definitions",
      defsRes.error
    );
    return { attributes: [], values: [] };
  }
  if (valuesRes.error) {
    console.error("Failed to load product attribute values", valuesRes.error);
    return { attributes: [], values: [] };
  }

  const attributes = (defsRes.data ?? []) as FilterableAttributeDefinition[];
  const values = (valuesRes.data ?? []) as ProductAttributeValueRow[];

  return { attributes, values };
}

export async function getCategoryBySlug(slug: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, vertical_card_layout")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load category", error);
    return null;
  }

  return data as Category | null;
}

export async function getCategoryById(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, vertical_card_layout")
    .eq("id", id)
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
    .select("id, category_id, name, slug, description, image_url, vertical_card_layout")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load subcategories", error);
    return [];
  }

  return data as Subcategory[];
}

export async function getSubcategoryBySlug(slug: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, name, slug, description, image_url, vertical_card_layout")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subcategory", error);
    return null;
  }

  return data as Subcategory | null;
}

export async function getSubcategoryById(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, name, slug, description, image_url, vertical_card_layout")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subcategory", error);
    return null;
  }

  return data as Subcategory | null;
}

export async function getProductsByCategorySlug(slug: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
    )
    .eq("is_active", true)
    .eq("category_slug", slug);

  if (error) {
    console.error("Failed to load products by category", error);
    return [];
  }

  return (data ?? []) as (Product & {
    is_active: boolean;
    is_featured?: boolean;
  })[];
}

export async function getProductsBySubcategorySlug(slug: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
    )
    .eq("is_active", true)
    .eq("subcategory_slug", slug);

  if (error) {
    console.error("Failed to load products by subcategory", error);
    return [];
  }

  return (data ?? []) as (Product & {
    is_active: boolean;
    is_featured?: boolean;
  })[];
}

export async function getProductBySlug(slug: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
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

  const { is_active, ...rest } = data as Product & {
    is_active: boolean;
    is_featured?: boolean;
  };
  return rest;
}

export async function getSimilarProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
    )
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .limit(limit);

  if (error) {
    console.error("Failed to load similar products", error);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function getProductAttributesForDisplay(
  productId: string,
  categoryId: string,
  subcategoryId: string | null
): Promise<ProductAttributeDisplay[]> {
  if (!supabase) return [];

  // получаем назначения характеристик для категории, подкатегории и товара
  const [catRes, subRes, prodRes, valuesRes] = await Promise.all([
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

  const map = new Map<
    string,
    { assignment: AssignmentRow; source: ScopeType }
  >();

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

  // Собираем только нужные ID атрибутов
  const attributeIds = Array.from(map.keys());
  if (attributeIds.length === 0) {
    return [];
  }

  // Загружаем только нужные определения атрибутов
  const defsRes = await supabase
    .from("attribute_definitions")
    .select("id, name, slug, data_type, unit, options")
    .in("id", attributeIds);

  if (defsRes.error) {
    console.error(defsRes.error);
    return [];
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
    const aOrder = map.get(a.id)?.assignment.sort_order ?? 0;
    const bOrder = map.get(b.id)?.assignment.sort_order ?? 0;
    return aOrder - bOrder;
  });

  return result;
}

export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  if (!supabase || !query.trim()) return [];

  try {
    const searchTerm = `%${query.trim()}%`;
    // Используем ilike с правильным синтаксисом для Supabase
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
      )
      .eq("is_active", true)
      .or(`name.ilike.${searchTerm},slug.ilike.${searchTerm},short_description.ilike.${searchTerm}`)
      .limit(limit);

    if (error) {
      console.error("Failed to search products", error);
      return [];
    }

    return (data ?? []) as Product[];
  } catch (error) {
    console.error("Failed to search products", error);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Failed to load featured products", error);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!supabase || ids.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, subcategory_id, name, slug, short_description, price, main_image_url, gallery, is_active, stock_quantity, is_custom_order, is_featured"
    )
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to load products by IDs", error);
    return [];
  }

  return (data ?? []) as Product[];
}