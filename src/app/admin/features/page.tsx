"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface FeatureRow {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminFeaturesPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadAll();
  }, [canUseSupabase]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("features")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setItems((data ?? []) as FeatureRow[]);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить преимущества");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string, currentValue: boolean) {
    if (!canUseSupabase) return;

    setSavingId(id);
    setError(null);

    try {
      const { error } = await supabase!
        .from("features")
        .update({ is_active: !currentValue })
        .eq("id", id);

      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить статус");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить преимущество?")) return;

    setSavingId(id);
    setError(null);

    try {
      const { error } = await supabase!.from("features").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить преимущество");
    } finally {
      setSavingId(null);
    }
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
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Преимущества</h1>
          <p className="text-sm text-muted-foreground">
            Управление блоком "Почему выбирают нас" на главной странице.
          </p>
        </div>
        <Link href="/admin/features/new">
          <Button>Новое преимущество</Button>
        </Link>
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
            Преимущества не добавлены
          </p>
          <Link href="/admin/features/new">
            <Button>Добавить первое преимущество</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Иконка</th>
                <th className="px-4 py-3 text-left font-medium">Название</th>
                <th className="px-4 py-3 text-left font-medium">Описание</th>
                <th className="px-4 py-3 text-left font-medium">Порядок</th>
                <th className="px-4 py-3 text-left font-medium">Статус</th>
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
                    <span className="text-2xl">{row.icon}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md">
                    <div className="line-clamp-2">{row.description}</div>
                  </td>
                  <td className="px-4 py-3">{row.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(row.id, row.is_active)}
                      disabled={savingId === row.id}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        row.is_active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.is_active ? "Активно" : "Неактивно"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/features/${row.id}`}
                        className="text-primary hover:underline"
                      >
                        ✎
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={savingId === row.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        🗑
                      </button>
                    </div>
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
