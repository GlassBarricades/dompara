'use client';

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

type ScopeType = "category" | "subcategory" | "product";

interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
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

interface CategoryOption {
  id: string;
  name: string;
}

interface SubcategoryOption {
  id: string;
  category_id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
}

interface AttributeState {
  attribute: AttributeDefinition;
  assigned: boolean;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
}

export default function AttributeAssignmentsPage() {
  const [scopeType, setScopeType] = useState<ScopeType>("category");
  const [selectedId, setSelectedId] = useState<string>("");

  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [attributeStates, setAttributeStates] = useState<AttributeState[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [attrRes, catRes, subRes, prodRes] = await Promise.all([
        supabase!
          .from("attribute_definitions")
          .select("id, name, slug")
          .order("name", { ascending: true }),
        supabase!
          .from("categories")
          .select("id, name")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("subcategories")
          .select("id, category_id, name")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("products")
          .select("id, name")
          .order("created_at", { ascending: false }),
      ]);

      if (attrRes.error) throw attrRes.error;
      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (prodRes.error) throw prodRes.error;

      const attrs = (attrRes.data ?? []) as AttributeDefinition[];
      setAttributes(attrs);
      setCategories((catRes.data ?? []) as CategoryOption[]);
      setSubcategories((subRes.data ?? []) as SubcategoryOption[]);
      setProducts((prodRes.data ?? []) as ProductOption[]);

      // выбрать по умолчанию первую категорию
      if (!selectedId && (catRes.data?.length ?? 0) > 0) {
        setSelectedId((catRes.data![0] as CategoryOption).id);
      }

      // initial attributeStates
      setAttributeStates(
        attrs.map((attribute) => ({
          attribute,
          assigned: false,
          is_required: false,
          is_filterable: false,
          sort_order: 0,
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить данные для назначений характеристик");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canUseSupabase) return;
    if (!selectedId || attributes.length === 0) return;
    void loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeType, selectedId, attributes.length, canUseSupabase]);

  async function loadAssignments() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("attribute_assignments")
        .select(
          "id, attribute_id, scope_type, scope_id, is_required, is_filterable, sort_order"
        )
        .eq("scope_type", scopeType)
        .eq("scope_id", selectedId);

      if (error) throw error;

      const rows = (data ?? []) as AssignmentRow[];
      const byAttr = new Map<string, AssignmentRow>();
      rows.forEach((r) => byAttr.set(r.attribute_id, r));

      setAttributeStates(
        attributes.map((attribute) => {
          const existing = byAttr.get(attribute.id);
          return {
            attribute,
            assigned: !!existing,
            is_required: existing?.is_required ?? false,
            is_filterable: existing?.is_filterable ?? false,
            sort_order: existing?.sort_order ?? 0,
          };
        })
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить назначения характеристик");
    } finally {
      setLoading(false);
    }
  }

  const scopeOptions: { id: string; name: string }[] = useMemo(() => {
    switch (scopeType) {
      case "category":
        return categories;
      case "subcategory":
        return subcategories;
      case "product":
        return products;
      default:
        return [];
    }
  }, [scopeType, categories, subcategories, products]);

  const currentScopeName = useMemo(() => {
    return scopeOptions.find((i) => i.id === selectedId)?.name ?? "";
  }, [scopeOptions, selectedId]);

  function handleAttributeToggle(id: string, field: keyof AttributeState, value: any) {
    setAttributeStates((prev) =>
      prev.map((s) =>
        s.attribute.id === id
          ? {
              ...s,
              [field]: value,
              // если включили required/filterable — автоматически включаем assigned
              assigned:
                field === "assigned"
                  ? value
                  : s.assigned || field === "is_required" || field === "is_filterable",
            }
          : s
      )
    );
  }

  async function handleSave() {
    if (!canUseSupabase) return;
    if (!selectedId) {
      setError("Выбери сущность (категорию/подкатегорию/товар)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // удаляем все старые назначения для выбранной сущности
      const { error: delError } = await supabase!
        .from("attribute_assignments")
        .delete()
        .eq("scope_type", scopeType)
        .eq("scope_id", selectedId);
      if (delError) throw delError;

      const toInsert = attributeStates
        .filter((s) => s.assigned)
        .map((s) => ({
          attribute_id: s.attribute.id,
          scope_type: scopeType,
          scope_id: selectedId,
          is_required: s.is_required,
          is_filterable: s.is_filterable,
          sort_order: s.sort_order,
        }));

      if (toInsert.length > 0) {
        const { error: insError } = await supabase!
          .from("attribute_assignments")
          .insert(toInsert);
        if (insError) throw insError;
      }

      await loadAssignments();
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить назначения характеристик");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Назначения характеристик</h1>
        <p className="text-sm text-muted-foreground">
          Определи, какие характеристики применяются к категориям, подкатегориям и отдельным товарам.
        </p>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Область:</span>
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={scopeType}
            onChange={(e) => {
              setScopeType(e.target.value as ScopeType);
              // сбросить выбранный id, чтобы пользователь явно выбрал сущность
              setSelectedId("");
              setAttributeStates((prev) =>
                prev.map((s) => ({
                  ...s,
                  assigned: false,
                  is_required: false,
                  is_filterable: false,
                  sort_order: 0,
                }))
              );
            }}
          >
            <option value="category">Категория</option>
            <option value="subcategory">Подкатегория</option>
            <option value="product">Товар</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">
            {scopeType === "category"
              ? "Категория"
              : scopeType === "subcategory"
              ? "Подкатегория"
              : "Товар"}
            :
          </span>
          <select
            className="min-w-[180px] rounded-md border bg-background px-2 py-1 text-xs"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Выберите...</option>
            {scopeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {"name" in opt ? opt.name : opt.id}
              </option>
            ))}
          </select>
        </div>

        {currentScopeName && (
          <span className="text-xs text-muted-foreground">
            Текущая сущность: {currentScopeName}
          </span>
        )}
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-[2fr,auto,auto,auto] gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Характеристика</span>
          <span className="text-center">Фильтр</span>
          <span className="text-center">Обязат.</span>
          <span className="text-center">Порядок</span>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : attributes.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Ещё нет характеристик. Сначала создайте их в разделе «Характеристики».
            </div>
          ) : !selectedId ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Выбери категорию, подкатегорию или товар, чтобы настроить характеристики.
            </div>
          ) : (
            attributeStates.map((row) => (
              <div
                key={row.attribute.id}
                className="grid grid-cols-[2fr,auto,auto,auto] items-center gap-4 px-4 py-2 text-sm"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    checked={row.assigned}
                    onChange={(e) =>
                      handleAttributeToggle(
                        row.attribute.id,
                        "assigned",
                        e.target.checked
                      )
                    }
                  />
                  <span>
                    {row.attribute.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({row.attribute.slug})
                    </span>
                  </span>
                </label>

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    checked={row.is_filterable}
                    onChange={(e) =>
                      handleAttributeToggle(
                        row.attribute.id,
                        "is_filterable",
                        e.target.checked
                      )
                    }
                    disabled={!row.assigned}
                  />
                </div>

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    checked={row.is_required}
                    onChange={(e) =>
                      handleAttributeToggle(
                        row.attribute.id,
                        "is_required",
                        e.target.checked
                      )
                    }
                    disabled={!row.assigned}
                  />
                </div>

                <div className="flex justify-center">
                  <input
                    type="number"
                    className="w-16 rounded-md border px-2 py-1 text-xs"
                    value={row.sort_order}
                    onChange={(e) =>
                      handleAttributeToggle(
                        row.attribute.id,
                        "sort_order",
                        Number(e.target.value) || 0
                      )
                    }
                    disabled={!row.assigned}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!selectedId || saving || !canUseSupabase}
        >
          {saving ? "Сохранение..." : "Сохранить для текущей сущности"}
        </Button>
      </div>
    </section>
  );
}


