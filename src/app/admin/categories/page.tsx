'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { Category } from "@/types";

type CategoryRow = Category & {
  sort_order: number;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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

  function handleDeleteClick(id: string) {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    if (!canUseSupabase || !itemToDelete) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("categories").delete().eq("id", itemToDelete);
      if (error) throw error;
      await loadCategories();
      toast.success("Категория успешно удалена");
    } catch (err) {
      console.error(err);
      const errorMessage = "Не удалось удалить категорию";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setItemToDelete(null);
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
        <Button asChild>
          <Link href="/admin/categories/new">Новая категория</Link>
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Название</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Порядок</th>
              <th className="px-3 py-2">Изображение</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Категории ещё не созданы.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.name}</div>
                    {row.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {row.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    /catalog/{row.slug}
                  </td>
                  <td className="px-3 py-3 text-sm">{row.sort_order}</td>
                  <td className="px-3 py-3">
                    {row.image_url ? (
                      <div className="h-10 w-16 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={row.image_url}
                          alt={row.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">нет</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon-sm" variant="outline">
                        <Link href={`/admin/categories/${row.id}`}>✎</Link>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(row.id)}
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Удалить категорию?"
        description="Это действие нельзя отменить. Все подкатегории и товары в этой категории также могут быть затронуты."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
      />
    </section>
  );
}
