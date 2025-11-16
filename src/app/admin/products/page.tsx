'use client';

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryOption {
  id: string;
  category_id: string;
  name: string;
  slug: string;
}

interface ProductRow {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  price: number | string | null;
  is_active: boolean;
  main_image_url?: string | null;
  gallery?: string[] | null;
}

type DataType = "string" | "number" | "boolean" | "select" | "multiselect";

interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  data_type: DataType;
  unit: string | null;
  options: any | null;
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

interface ProductAttributeState {
  attribute: AttributeDefinition;
  source: ScopeType;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  value: any;
}

const emptyForm = {
  category_id: "",
  subcategory_id: "" as string | "",
  name: "",
  slug: "",
  short_description: "",
  price: "",
  is_active: true,
  main_image_url: "",
  gallery: "" as string | "",
};

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeDefinition[]>([]);
  const [productAttributes, setProductAttributes] = useState<
    ProductAttributeState[]
  >([]);
  const [attrsLoading, setAttrsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  // При создании товара автоматически подгружаем характеристики
  // после выбора категории/подкатегории
  useEffect(() => {
    if (!canUseSupabase) return;
    if (!form.category_id) {
      setProductAttributes([]);
      return;
    }
    // Для нового товара (нет editingId) берём только назначения категории/подкатегории
    if (!editingId) {
      void loadNewProductAttributes(form.category_id, form.subcategory_id || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, form.category_id, form.subcategory_id, editingId]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [catRes, subRes, prodRes, attrRes] = await Promise.all([
        supabase!
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("subcategories")
          .select("id, category_id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("products")
          .select(
            "id, category_id, subcategory_id, name, slug, short_description, price, is_active, main_image_url, gallery"
          )
          .order("created_at", { ascending: false }),
        supabase!
          .from("attribute_definitions")
          .select("id, name, slug, data_type, unit, options")
          .order("name", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (prodRes.error) throw prodRes.error;
      if (attrRes.error) throw attrRes.error;

      setCategories((catRes.data ?? []) as CategoryOption[]);
      setSubcategories((subRes.data ?? []) as SubcategoryOption[]);
      setItems((prodRes.data ?? []) as ProductRow[]);
      setAllAttributes((attrRes.data ?? []) as AttributeDefinition[]);

      if (!form.category_id && (catRes.data?.length ?? 0) > 0) {
        setForm((prev) => ({
          ...prev,
          category_id: (catRes.data![0] as CategoryOption).id,
        }));
      }
      if (!filterCategoryId && (catRes.data?.length ?? 0) > 0) {
        setFilterCategoryId((catRes.data![0] as CategoryOption).id);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить товары/категории/подкатегории");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!filterCategoryId) return items;
    return items.filter((i) => i.category_id === filterCategoryId);
  }, [items, filterCategoryId]);

  const availableSubcategories = useMemo(() => {
    if (!form.category_id) return [];
    return subcategories.filter((s) => s.category_id === form.category_id);
  }, [subcategories, form.category_id]);

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setProductAttributes([]);
    setForm((prev) => ({
      ...emptyForm,
      category_id: prev.category_id || filterCategoryId || prev.category_id,
    }));
  }

  async function startEdit(row: ProductRow) {
    setEditingId(row.id);
    setForm({
      category_id: row.category_id,
      subcategory_id: row.subcategory_id ?? "",
      name: row.name,
      slug: row.slug,
      short_description: row.short_description ?? "",
      price: String(row.price ?? ""),
      is_active: row.is_active,
      main_image_url: row.main_image_url ?? "",
      gallery: Array.isArray(row.gallery)
        ? row.gallery.join("\n")
        : "",
    });

    if (canUseSupabase) {
      await loadProductAttributes(row.id, row.category_id, row.subcategory_id);
    }
  }

  async function loadProductAttributes(
    productId: string,
    categoryId: string,
    subcategoryId: string | null
  ) {
    if (!supabase || allAttributes.length === 0) return;

    setAttrsLoading(true);
    try {
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

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (prodRes.error) throw prodRes.error;
      if (valuesRes.error) throw valuesRes.error;

      const assignments: AssignmentRow[] = [];
      assignments.push(...((catRes.data ?? []) as AssignmentRow[]));
      assignments.push(...((subRes.data ?? []) as AssignmentRow[]));
      assignments.push(...((prodRes.data ?? []) as AssignmentRow[]));

      const map = new Map<string, { assignment: AssignmentRow; source: ScopeType }>();

      // категория
      for (const a of catRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, { assignment: assign, source: "category" });
      }
      // подкатегория
      for (const a of subRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, { assignment: assign, source: "subcategory" });
      }
      // продукт
      for (const a of prodRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, { assignment: assign, source: "product" });
      }

      const valuesByAttr = new Map<string, any>();
      for (const row of valuesRes.data ?? []) {
        valuesByAttr.set((row as any).attribute_id, (row as any).value);
      }

      const states: ProductAttributeState[] = [];

      map.forEach(({ assignment, source }, attributeId) => {
        const def = allAttributes.find((a) => a.id === attributeId);
        if (!def) return;
        const raw = valuesByAttr.get(attributeId);
        states.push({
          attribute: def,
          source,
          is_required: assignment.is_required,
          is_filterable: assignment.is_filterable,
          sort_order: assignment.sort_order,
          value: convertRawValueToUi(def.data_type, raw),
        });
      });

      states.sort((a, b) => a.sort_order - b.sort_order);
      setProductAttributes(states);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить характеристики товара");
    } finally {
      setAttrsLoading(false);
    }
  }

  async function loadNewProductAttributes(
    categoryId: string,
    subcategoryId: string | null
  ) {
    if (!supabase || allAttributes.length === 0) return;

    setAttrsLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
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
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;

      const map = new Map<string, { assignment: AssignmentRow; source: ScopeType }>();

      for (const a of catRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, { assignment: assign, source: "category" });
      }
      for (const a of subRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, { assignment: assign, source: "subcategory" });
      }

      const states: ProductAttributeState[] = [];

      map.forEach(({ assignment, source }, attributeId) => {
        const def = allAttributes.find((a) => a.id === attributeId);
        if (!def) return;
        states.push({
          attribute: def,
          source,
          is_required: assignment.is_required,
          is_filterable: assignment.is_filterable,
          sort_order: assignment.sort_order,
          value: convertRawValueToUi(def.data_type, null),
        });
      });

      states.sort((a, b) => a.sort_order - b.sort_order);
      setProductAttributes(states);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить характеристики для нового товара");
    } finally {
      setAttrsLoading(false);
    }
  }

  function convertRawValueToUi(dataType: DataType, raw: any) {
    if (raw === null || raw === undefined) return dataType === "multiselect" ? [] : "";
    switch (dataType) {
      case "string":
      case "select":
        return String(raw ?? "");
      case "number":
        return typeof raw === "number" ? String(raw) : String(Number(raw) || "");
      case "boolean":
        return Boolean(raw);
      case "multiselect":
        return Array.isArray(raw) ? raw : [];
      default:
        return raw;
    }
  }

  function convertUiValueToJson(dataType: DataType, value: any) {
    switch (dataType) {
      case "string":
      case "select":
        return value ? String(value) : null;
      case "number": {
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
      }
      case "boolean":
        return Boolean(value);
      case "multiselect":
        return Array.isArray(value) ? value : [];
      default:
        return value ?? null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.category_id) {
      setError("Нужно выбрать категорию");
      return;
    }
    if (!form.name || !form.slug) {
      setError("Заполни название и slug");
      return;
    }

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Цена должна быть неотрицательным числом");
      return;
    }

    const category = categories.find((c) => c.id === form.category_id);
    if (!category) {
      setError("Выбранная категория не найдена");
      return;
    }

    const subcat =
      form.subcategory_id &&
      subcategories.find((s) => s.id === form.subcategory_id);

    const payload = {
      category_id: form.category_id,
      subcategory_id: subcat ? subcat.id : null,
      category_slug: category.slug,
      subcategory_slug: subcat ? subcat.slug : null,
      name: form.name,
      slug: form.slug,
      short_description: form.short_description || null,
      price: priceNumber,
      is_active: form.is_active,
      main_image_url: form.main_image_url || null,
      gallery:
        form.gallery && String(form.gallery).trim().length
          ? String(form.gallery)
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          : null,
    };

    setSaving(true);
    setError(null);

    try {
      let productId = editingId;

      if (editingId) {
        const { error } = await supabase!
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase!
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = (data as { id: string }).id;
      }

      // сохраняем значения характеристик только для существующего товара
      if (productId && productAttributes.length > 0) {
        const rows = productAttributes
          .map((state) => {
            const jsonValue = convertUiValueToJson(
              state.attribute.data_type,
              state.value
            );
            if (
              jsonValue === null ||
              (Array.isArray(jsonValue) && jsonValue.length === 0)
            ) {
              return null;
            }
            return {
              product_id: productId,
              attribute_id: state.attribute.id,
              value: jsonValue,
            };
          })
          .filter((r): r is { product_id: string; attribute_id: string; value: any } => !!r);

        const { error: delError } = await supabase!
          .from("product_attribute_values")
          .delete()
          .eq("product_id", productId);
        if (delError) throw delError;

        if (rows.length > 0) {
          const { error: insertError } = await supabase!
            .from("product_attribute_values")
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      await loadAll();
      setEditingId(null);
      setProductAttributes([]);
      setForm((prev) => ({
        ...emptyForm,
        category_id: prev.category_id || filterCategoryId || prev.category_id,
      }));
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить товар");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить товар?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("products").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
      if (editingId === id) {
        setEditingId(null);
        setForm((prev) => ({
          ...emptyForm,
          category_id: prev.category_id || filterCategoryId || prev.category_id,
        }));
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить товар");
    } finally {
      setSaving(false);
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Без категории";
  }

  function getSubcategoryName(id: string | null) {
    if (!id) return "";
    return subcategories.find((s) => s.id === id)?.name ?? "";
  }

  function formatPrice(value: ProductRow["price"]) {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("ru-RU");
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Товары</h1>
          <p className="text-sm text-muted-foreground">
            Управление товарами каталога.
          </p>
        </div>
        <Button variant="outline" onClick={startCreate}>
          Новый товар
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
            <span className="text-muted-foreground">Список товаров</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-xs"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Загрузка...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Для этой категории ещё нет товаров.
              </div>
            ) : (
              filteredItems.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-1">
                    {row.main_image_url && (
                      <div className="overflow-hidden rounded-md border bg-muted">
                        <img
                          src={row.main_image_url}
                          alt={row.name}
                          className="h-12 w-20 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{row.name}</div>
                      {!row.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          скрыт
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Категория: {getCategoryName(row.category_id)}
                      {row.subcategory_id && (
                        <> / {getSubcategoryName(row.subcategory_id)}</>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /product/{row.slug}
                    </div>
                    <div className="text-xs font-semibold">
                      {formatPrice(row.price)} ₽
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => startEdit(row)}
                    >
                      ✎
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(row.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId ? "Редактирование товара" : "Новый товар"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">Категория</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.category_id}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("category_id", value);
                  // сбрасываем подкатегорию, если сменили категорию
                  handleChange("subcategory_id", "");
                }}
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Подкатегория (опционально)</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.subcategory_id}
                onChange={(e) =>
                  handleChange("subcategory_id", e.target.value || "")
                }
                disabled={!form.category_id}
              >
                <option value="">Без подкатегории</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Название</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug (для URL)</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Пример: <code>pech-dlya-bani-x</code>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">URL основного изображения</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.main_image_url ?? ""}
                onChange={(e) => handleChange("main_image_url", e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Используется в карточке товара и списках. Можно указать ссылку из
                Supabase Storage.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Дополнительные изображения (по одному URL в строке)
              </label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={form.gallery ?? ""}
                onChange={(e) => handleChange("gallery", e.target.value)}
                placeholder={"https://...\nhttps://...\nhttps://..."}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Короткое описание</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={form.short_description ?? ""}
                onChange={(e) =>
                  handleChange("short_description", e.target.value)
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Цена (₽)</label>
              <input
                type="number"
                step="1"
                min="0"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is_active"
                type="checkbox"
                className="h-4 w-4 rounded border"
                checked={form.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
              />
              <label htmlFor="is_active" className="text-sm">
                Показывать в каталоге
              </label>
            </div>

            {/* Характеристики товара */}
            <div className="space-y-3 pt-4 border-t mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Характеристики товара</h3>
                {attrsLoading && (
                  <span className="text-xs text-muted-foreground">
                    Загрузка...
                  </span>
                )}
              </div>
              {productAttributes.length === 0 && !attrsLoading && (
                <p className="text-xs text-muted-foreground">
                  Для выбранной категории/подкатегории ещё не назначены характеристики
                  (или они не загружены). Настрой их в разделе «Назначения
                  характеристик».
                </p>
              )}
              {productAttributes.length > 0 && (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {productAttributes.map((row, index) => (
                    <div key={row.attribute.id} className="space-y-1">
                      <div className="flex items-center justify между gap-2">
                        <label className="text-sm font-medium">
                          {row.attribute.name}
                          {row.attribute.unit && (
                            <span className="text-xs text-muted-foreground">
                              {" "}
                              ({row.attribute.unit})
                            </span>
                          )}
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {row.source === "category"
                            ? "категория"
                            : row.source === "subcategory"
                            ? "подкатегория"
                            : "товар"}
                        </span>
                      </div>
                      {renderAttributeInput(row, (nextValue) => {
                        setProductAttributes((prev) =>
                          prev.map((s, i) =>
                            i === index ? { ...s, value: nextValue } : s
                          )
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving || !canUseSupabase}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={startCreate}
                  disabled={saving}
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function renderAttributeInput(
  row: ProductAttributeState,
  onChange: (nextValue: any) => void
) {
  const { attribute, value } = row;

  switch (attribute.data_type) {
    case "string":
      return (
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-xs text-muted-foreground">Да / Нет</span>
        </div>
      );
    case "select":
      return (
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Не выбрано</option>
          {Array.isArray(attribute.options) &&
            attribute.options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label ?? opt.value}
              </option>
            ))}
        </select>
      );
    case "multiselect":
      return (
        <select
          multiple
          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions).map(
              (o) => o.value
            );
            onChange(options);
          }}
        >
          {Array.isArray(attribute.options) &&
            attribute.options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label ?? opt.value}
              </option>
            ))}
        </select>
      );
    default:
      return null;
  }
}
