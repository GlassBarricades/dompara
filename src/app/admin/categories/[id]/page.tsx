'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slugify";

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  image_url: string;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  image_url: "",
};

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !id) return;
    void loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, id]);

  async function loadCategory() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase!
      .from("categories")
      .select("id, name, slug, description, sort_order, image_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setError("Не удалось загрузить категорию");
    } else if (!data) {
      setError("Категория не найдена");
    } else {
      setForm({
        name: data.name ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        sort_order: data.sort_order ?? 0,
        image_url: data.image_url ?? "",
      });
      setSlugTouched(true);
    }

    setLoading(false);
  }

  function handleChange<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("categories")
        .update({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          sort_order: form.sort_order,
          image_url: form.image_url || null,
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/admin/categories");
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить категорию");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить категорию? Это действие нельзя отменить.")) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase!
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      router.push("/admin/categories");
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить категорию");
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование категории</h1>
          <p className="text-sm text-muted-foreground">
            Измените параметры категории или удалите её.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
        >
          Назад к списку
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : (
        <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
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
              Пример: <code>pechi</code>, <code>aksessuary</code>.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Описание</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">URL изображения</label>
            <input
              type="url"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.image_url}
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
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={saving}
            >
              Удалить
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}


