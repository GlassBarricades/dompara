'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase-client";
import type { Review } from "@/lib/reviews-api";
import { Button } from "@/components/ui/button";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadReviews();
  }, [canUseSupabase]);

  async function loadReviews() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase!
      .from("reviews")
      .select("id, customer_name, customer_photo_url, rating, text, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setError("Не удалось загрузить отзывы");
    } else {
      setItems((data ?? []) as Review[]);
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (
      !window.confirm(
        "Удалить отзыв? Это действие нельзя будет отменить.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadReviews();
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить отзыв");
    } finally {
      setSaving(false);
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-500" : "text-muted-foreground"}>
        ★
      </span>
    ));
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Отзывы клиентов</h1>
          <p className="text-sm text-muted-foreground">
            Управление отзывами, которые отображаются на главной странице.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/reviews/new">Новый отзыв</Link>
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Клиент</th>
              <th className="px-3 py-2">Рейтинг</th>
              <th className="px-3 py-2">Текст</th>
              <th className="px-3 py-2">Сортировка</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Пока нет отзывов. Создайте первый отзыв.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {item.customer_photo_url && (
                        <img
                          src={item.customer_photo_url}
                          alt={item.customer_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{item.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">{renderStars(item.rating)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="max-w-md truncate text-muted-foreground">
                      {item.text}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {item.sort_order}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.is_active ? "Активен" : "Скрыт"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                      >
                        <Link href={`/admin/reviews/${item.id}`}>✎</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

