"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { slugify } from "@/lib/slugify";

type DataType = "string" | "number" | "boolean" | "select" | "multiselect";
type ScopeType = "category" | "subcategory" | "product";

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

interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  data_type: DataType;
  unit: string | null;
  options: any | null;
}

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
  stock_quantity: "",
  is_active: true,
  is_featured: false,
  is_custom_order: false,
  main_image_url: "",
  gallery: "" as string | "",
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeDefinition[]>([]);
  const [productAttributes, setProductAttributes] = useState<
    ProductAttributeState[]
  >([]);

  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attrsLoading, setAttrsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [catRes, subRes, attrRes] = await Promise.all([
        supabase!
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("subcategories")
          .select("id, category_id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("attribute_definitions")
          .select("id, name, slug, data_type, unit, options")
          .order("name", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (attrRes.error) throw attrRes.error;

      const cats = (catRes.data ?? []) as CategoryOption[];
      setCategories(cats);
      setSubcategories((subRes.data ?? []) as SubcategoryOption[]);
      setAllAttributes((attrRes.data ?? []) as AttributeDefinition[]);

      if (!form.category_id && cats.length > 0) {
        setForm((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить данные для создания товара");
    } finally {
      setLoading(false);
    }
  }

  const availableSubcategories = useMemo(() => {
    if (!form.category_id) return [];
    return subcategories.filter((s) => s.category_id === form.category_id);
  }, [subcategories, form.category_id]);

  useEffect(() => {
    if (!canUseSupabase) return;
    if (!form.category_id || allAttributes.length === 0) {
      setProductAttributes([]);
      return;
    }
    void loadNewProductAttributes(
      form.category_id,
      form.subcategory_id || null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.category_id,
    form.subcategory_id,
    allAttributes.length,
    canUseSupabase,
  ]);

  async function loadNewProductAttributes(
    categoryId: string,
    subcategoryId: string | null
  ) {
    setAttrsLoading(true);
    setError(null);
    try {
      const [catRes, subRes] = await Promise.all([
        supabase!
          .from("attribute_assignments")
          .select(
            "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
          )
          .eq("scope_type", "category")
          .eq("scope_id", categoryId),
        subcategoryId
          ? supabase!
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

      const map = new Map<
        string,
        { assignment: AssignmentRow; source: ScopeType }
      >();

      for (const a of catRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, {
          assignment: assign,
          source: "category",
        });
      }
      for (const a of subRes.data ?? []) {
        const assign = a as AssignmentRow;
        map.set(assign.attribute_id, {
          assignment: assign,
          source: "subcategory",
        });
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

  function handleChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function convertRawValueToUi(dataType: DataType, raw: any) {
    if (raw === null || raw === undefined)
      return dataType === "multiselect" ? [] : "";
    switch (dataType) {
      case "string":
      case "select":
        return String(raw ?? "");
      case "number":
        return typeof raw === "number"
          ? String(raw)
          : String(Number(raw) || "");
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

    const stockQuantityNumber = form.is_custom_order
      ? null
      : form.stock_quantity && String(form.stock_quantity).trim()
      ? Number(form.stock_quantity)
      : null;

    if (
      stockQuantityNumber !== null &&
      (Number.isNaN(stockQuantityNumber) || stockQuantityNumber < 0)
    ) {
      setError("Остаток должен быть неотрицательным числом");
      return;
    }

    const payload = {
      category_id: form.category_id,
      subcategory_id: subcat ? subcat.id : null,
      category_slug: category.slug,
      subcategory_slug: subcat ? subcat.slug : null,
      name: form.name,
      slug: form.slug,
      short_description: form.short_description || null,
      price: priceNumber,
      stock_quantity: stockQuantityNumber,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_custom_order: form.is_custom_order,
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
      const { data, error } = await supabase!
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      const productId = (data as { id: string }).id;

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
          .filter(
            (
              r
            ): r is { product_id: string; attribute_id: string; value: any } =>
              !!r
          );

        if (rows.length > 0) {
          const { error: insertError } = await supabase!
            .from("product_attribute_values")
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить товар");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Новый товар</h1>
        <p className="text-sm text-muted-foreground">
          Заполни карточку товара и характеристики. Товар можно будет скрыть от
          показа в каталоге.
        </p>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        className="space-y-4 rounded-md border bg-background p-4 md:p-6"
        onSubmit={handleSubmit}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Категория</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleChange("category_id", value);
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
                <label className="text-sm font-medium">
                  Подкатегория (опционально)
                </label>
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
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Название</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: value,
                    slug: slugTouched ? prev.slug : slugify(value),
                  }));
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug (для URL)</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  handleChange("slug", e.target.value);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Пример: <code>pech-dlya-bani-x</code>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                URL основного изображения
              </label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.main_image_url ?? ""}
                onChange={(e) => handleChange("main_image_url", e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Используется в карточке товара и списках. Можно указать ссылку
                из Supabase Storage.
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
              <RichTextEditor
                value={form.short_description ?? ""}
                onChange={(html) => handleChange("short_description", html)}
                placeholder="Введите описание товара..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Цена (BYN)</label>
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

              <div className="space-y-1">
                <label className="text-sm font-medium">Остаток (шт.)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted disabled:cursor-not-allowed"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    handleChange("stock_quantity", e.target.value)
                  }
                  placeholder="Не указан"
                  disabled={form.is_custom_order}
                />
                <p className="text-xs text-muted-foreground">
                  {form.is_custom_order
                    ? "Для товаров под заказ остаток не отслеживается"
                    : "Оставьте пустым, если остаток не отслеживается"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
                <input
                  id="is_featured"
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={form.is_featured}
                  onChange={(e) =>
                    handleChange("is_featured", e.target.checked)
                  }
                />
                <label htmlFor="is_featured" className="text-sm">
                  Показывать в разделе "Популярные товары" на главной странице
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_custom_order"
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={form.is_custom_order}
                  onChange={(e) => {
                    handleChange("is_custom_order", e.target.checked);
                    if (e.target.checked) {
                      handleChange("stock_quantity", "");
                    }
                  }}
                />
                <label htmlFor="is_custom_order" className="text-sm">
                  Товар изготавливается под заказ (остатки не отслеживаются)
                </label>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4 mt-4">
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
                  Для выбранной категории/подкатегории ещё не назначены
                  характеристики. Настрой их в разделе «Назначения
                  характеристик».
                </p>
              )}
              {productAttributes.length > 0 && (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {productAttributes.map((row, index) => (
                    <div key={row.attribute.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
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
                {saving ? "Сохранение..." : "Создать"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/admin/products")}
                disabled={saving}
              >
                Отмена
              </Button>
            </div>
          </>
        )}
      </form>
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
