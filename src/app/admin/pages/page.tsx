"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import type { PageContent } from "@/lib/page-content-api";

export default function AdminPagesPage() {
  const [items, setItems] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadPages();
  }, [canUseSupabase]);

  async function loadPages() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("page_content")
        .select("*")
        .order("page_key", { ascending: true });

      if (error) throw error;
      setItems((data ?? []) as PageContent[]);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить страницы");
    } finally {
      setLoading(false);
    }
  }

  const pageKeyLabels: Record<string, string> = {
    delivery: "Доставка и оплата",
    about: "О компании",
    faq: "FAQ",
    guarantees: "Гарантии",
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Управление страницами</h1>
          <p className="text-sm text-muted-foreground">
            Редактирование контента статических страниц сайта.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">Новая страница</Link>
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Страницы не добавлены
          </p>
          <Link href="/admin/pages/new">
            <Button>Добавить первую страницу</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ключ</th>
                <th className="px-4 py-3 text-left font-medium">Заголовок</th>
                <th className="px-4 py-3 text-left font-medium">Обновлено</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {row.page_key}
                    </code>
                    {pageKeyLabels[row.page_key] && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {pageKeyLabels[row.page_key]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.updated_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pages/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      ✎ Редактировать
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
