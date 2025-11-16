'use client';

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

const emptyForm = {
  category_id: "",
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  image_url: "" as string | "",
};

export default function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [items, setItems] = useState<SubcategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadCategoriesAndSubcategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadCategoriesAndSubcategories() {
    setLoading(true);
    setError(null);

    try {
      const [catRes, subRes] = await Promise.all([
        supabase!
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("subcategories")
          .select("id, category_id, name, slug, description, sort_order, image_url")
          .order("sort_order", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;

      setCategories((catRes.data ?? []) as CategoryOption[]);
      setItems((subRes.data ?? []) as SubcategoryRow[]);

      // если форма пустая, выбираем первую категорию по умолчанию
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
      setError("Не удалось загрузить подкатегории или категории");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!filterCategoryId) return items;
    return items.filter((i) => i.category_id === filterCategoryId);
  }, [items, filterCategoryId]);

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm((prev) => ({
      ...emptyForm,
      category_id: prev.category_id || filterCategoryId || prev.category_id,
    }));
  }

  function startEdit(row: SubcategoryRow) {
    setEditingId(row.id);
    setForm({
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      sort_order: row.sort_order,
      image_url: (row as any).image_url ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;
    if (!form.category_id) {
      setError("Нужно выбрать категорию");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const { error } = await supabase!
          .from("subcategories")
          .update({
            category_id: form.category_id,
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            sort_order: form.sort_order,
            image_url: form.image_url || null,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase!.from("subcategories").insert({
          category_id: form.category_id,
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          sort_order: form.sort_order,
          image_url: form.image_url || null,
        });

        if (error) throw error;
      }

      await loadCategoriesAndSubcategories();
      setEditingId(null);
      setForm((prev) => ({ ...emptyForm, category_id: prev.category_id }));
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить подкатегорию");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить подкатегорию?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("subcategories").delete().eq("id", id);
      if (error) throw error;
      await loadCategoriesAndSubcategories();
      if (editingId === id) {
        setEditingId(null);
        setForm((prev) => ({ ...emptyForm, category_id: prev.category_id }));
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить подкатегорию");
    } finally {
      setSaving(false);
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Без категории";
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Подкатегории</h1>
          <p className="text-sm text-muted-foreground">
            Управление подкатегориями внутри выбранных категорий.
          </p>
        </div>
        <Button variant="outline" onClick={startCreate}>
          Новая подкатегория
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
            <span className="text-muted-foreground">Список подкатегорий</span>
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
                Подкатегории для этой категории ещё не созданы.
              </div>
            ) : (
              filteredItems.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-1">
                    {(row as any).image_url && (
                      <div className="overflow-hidden rounded-md border bg-muted">
                        <img
                          src={(row as any).image_url}
                          alt={row.name}
                          className="h-12 w-20 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="font-medium">
                      {row.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        (order: {row.sort_order})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Категория: {getCategoryName(row.category_id)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /catalog/{categories.find((c) => c.id === row.category_id)?.slug}/
                      {row.slug}
                    </div>
                    {row.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {row.description}
                      </div>
                    )}
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
            {editingId ? "Редактирование подкатегории" : "Новая подкатегория"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">Категория</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
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
                Пример: <code>drovyanye</code>, <code>elektricheskie</code>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Описание</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">URL изображения</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.image_url ?? ""}
                onChange={(e) => handleChange("image_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Порядок сортировки</label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.sort_order}
                onChange={(e) =>
                  handleChange("sort_order", Number(e.target.value) || 0)
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
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
