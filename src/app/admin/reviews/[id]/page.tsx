'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface ReviewFormState {
  customer_name: string;
  customer_photo_url: string;
  rating: number;
  text: string;
  sort_order: number;
  is_active: boolean;
}

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<ReviewFormState>({
    customer_name: "",
    customer_photo_url: "",
    rating: 5,
    text: "",
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !id) return;
    void loadReview();
  }, [canUseSupabase, id]);

  async function loadReview() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("reviews")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError("Отзыв не найден");
        setLoading(false);
        return;
      }

      setForm({
        customer_name: data.customer_name || "",
        customer_photo_url: data.customer_photo_url || "",
        rating: data.rating || 5,
        text: data.text || "",
        sort_order: data.sort_order || 0,
        is_active: data.is_active !== false,
      });
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить отзыв");
    } finally {
      setLoading(false);
    }
  }

  function handleChange<K extends keyof ReviewFormState>(
    key: K,
    value: ReviewFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.customer_name.trim() || !form.text.trim()) {
      setError("Заполните имя клиента и текст отзыва");
      return;
    }

    if (form.rating < 1 || form.rating > 5) {
      setError("Рейтинг должен быть от 1 до 5");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("reviews")
        .update({
          customer_name: form.customer_name,
          customer_photo_url: form.customer_photo_url || null,
          rating: form.rating,
          text: form.text,
          sort_order: form.sort_order,
          is_active: form.is_active,
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/admin/reviews");
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить отзыв");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить отзыв?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
      router.push("/admin/reviews");
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить отзыв");
      setSaving(false);
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleChange("rating", i + 1)}
        className={`text-2xl ${
          i < rating ? "text-yellow-500" : "text-muted-foreground"
        } hover:opacity-80 transition-opacity`}
      >
        ★
      </button>
    ));
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование отзыва</h1>
          <p className="text-sm text-muted-foreground">
            Измените данные отзыва клиента.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/reviews")}
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

      <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Имя клиента</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.customer_name}
            onChange={(e) => handleChange("customer_name", e.target.value)}
            required
            placeholder="Иван Иванов"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">URL фото клиента (опционально)</label>
          <input
            type="url"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.customer_photo_url}
            onChange={(e) => handleChange("customer_photo_url", e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Ссылка на аватар клиента. Рекомендуется квадратное изображение.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Рейтинг</label>
          <div className="flex items-center gap-2">
            {renderStars(form.rating)}
            <span className="text-sm text-muted-foreground">
              {form.rating} из 5
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Текст отзыва</label>
          <textarea
            className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm"
            value={form.text}
            onChange={(e) => handleChange("text", e.target.value)}
            required
            placeholder="Текст отзыва клиента..."
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
          <p className="text-xs text-muted-foreground">
            Отзывы сортируются по возрастанию этого значения.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={form.is_active}
            onChange={(e) => handleChange("is_active", e.target.checked)}
          />
          <label htmlFor="is_active" className="text-sm">
            Показывать отзыв на главной странице
          </label>
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Удалить
          </Button>
        </div>
      </form>
    </section>
  );
}

