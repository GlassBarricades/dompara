'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
}

const emptyForm: Omit<CategoryRow, "id"> = {
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  image_url: "",
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;

    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase!
      .from("categories")
      .select("id, name, slug, description, sort_order, image_url")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setError("Не удалось загрузить категории");
    } else {
      setItems((data ?? []) as CategoryRow[]);
    }

    setLoading(false);
  }

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(row: CategoryRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      sort_order: row.sort_order,
      image_url: row.image_url ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const { error } = await supabase!
          .from("categories")
          .update({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            sort_order: form.sort_order,
            image_url: form.image_url || null,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase!.from("categories").insert({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          sort_order: form.sort_order,
          image_url: form.image_url || null,
        });

        if (error) throw error;
      }

      await loadCategories();
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    // минимальная защита от случайного удаления
    if (!window.confirm("Удалить категорию? Это действие нельзя отменить.")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("categories").delete().eq("id", id);
      if (error) throw error;
      await loadCategories();
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить категорию");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Категории</h1>
          <p className="text-sm text-muted-foreground">
            Управление основными разделами каталога.
          </p>
        </div>
        <Button variant="outline" onClick={startCreate}>
          Новая категория
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
          <div className="border-b px-4 py-2 text-sm text-muted-foreground">
            Список категорий
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Загрузка...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Категории ещё не созданы.
              </div>
            ) : (
              items.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-1">
                    {row.image_url && (
                      <div className="overflow-hidden rounded-md border bg-muted">
                        <img
                          src={row.image_url}
                          alt={row.name}
                          className="h-16 w-24 object-cover"
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
                      /catalog/{row.slug}
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
            {editingId ? "Редактирование категории" : "Новая категория"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                Пример: <code>pechi</code>, <code>aksessuary</code>.
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
              <p className="text-xs text-muted-foreground">
                Ссылка на картинку категории (например, из Supabase Storage).
              </p>
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
