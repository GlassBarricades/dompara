'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase-client";
import type { HomepageBanner } from "@/lib/homepage-banners-api";
import { Button } from "@/components/ui/button";

export default function AdminBannersPage() {
  const [items, setItems] = useState<HomepageBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadBanners();
  }, [canUseSupabase]);

  async function loadBanners() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase!
      .from("homepage_banners")
      .select(
        "id, title, subtitle, description, image_url, link_url, button_text, sort_order, is_active",
      )
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setError("Не удалось загрузить баннеры");
    } else {
      setItems((data ?? []) as HomepageBanner[]);
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (
      !window.confirm(
        "Удалить баннер? Это действие нельзя будет отменить.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("homepage_banners")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadBanners();
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить баннер");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Баннеры главной страницы</h1>
          <p className="text-sm text-muted-foreground">
            Слайды первого экрана. Баннеры показываются в слайдере в порядке
            сортировки.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/banners/new">Новый баннер</Link>
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
              <th className="px-3 py-2">Заголовок</th>
              <th className="px-3 py-2">Описание</th>
              <th className="px-3 py-2">Порядок</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Изображение</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Баннеры ещё не созданы.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.title}</div>
                    {row.subtitle && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {row.subtitle}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    <div className="line-clamp-2">{row.description}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">{row.sort_order}</td>
                  <td className="px-3 py-3 text-xs">
                    {row.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Активен
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Выключен
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {row.image_url ? (
                      <div className="h-10 w-16 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={row.image_url}
                          alt={row.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        нет
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon-sm" variant="outline">
                        <Link href={`/admin/banners/${row.id}`}>✎</Link>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(row.id)}
                        disabled={saving}
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


