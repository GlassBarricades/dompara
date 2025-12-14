"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryOption {
  id: string;
  category_id: string;
  name: string;
  slug: string;
}

import type { Product } from "@/types";

type ProductRow = Product & {
  price: number | string | null;
  is_active: boolean;
  is_featured: boolean;
  is_custom_order: boolean;
  stock_quantity: number | null;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  gallery: string[] | null;
  id: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Читаем фильтр из URL параметров
  const filterCategoryIdFromUrl = searchParams.get("category") || "";
  const [filterCategoryId, setFilterCategoryId] = useState<string>(filterCategoryIdFromUrl);
  const [isInitialized, setIsInitialized] = useState(false);

  const canUseSupabase = !!supabase;

  // Синхронизируем состояние с URL параметрами при изменении URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category") || "";
    if (categoryFromUrl !== filterCategoryId) {
      setFilterCategoryId(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [catRes, subRes, prodRes] = await Promise.all([
        supabase!
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("subcategories")
          .select("id, category_id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("products")
          .select(
            "id, category_id, subcategory_id, name, slug, short_description, price, is_active, is_featured, is_custom_order, main_image_url, gallery, stock_quantity"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (prodRes.error) throw prodRes.error;

      const cats = (catRes.data ?? []) as CategoryOption[];
      setCategories(cats);
      setSubcategories((subRes.data ?? []) as SubcategoryOption[]);
      setItems((prodRes.data ?? []) as ProductRow[]);

      // Если фильтр не установлен в URL и есть категории, устанавливаем первую
      const currentFilter = searchParams.get("category") || "";
      if (!currentFilter && cats.length > 0 && !isInitialized) {
        const firstCategoryId = cats[0].id;
        setFilterCategoryId(firstCategoryId);
        setIsInitialized(true);
        // Обновляем URL без перезагрузки страницы
        const params = new URLSearchParams();
        params.set("category", firstCategoryId);
        router.replace(`/admin/products?${params.toString()}`, { scroll: false });
      } else if (currentFilter || cats.length === 0) {
        setIsInitialized(true);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить товары/категории/подкатегории");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!filterCategoryId) return items;
    return items.filter((i) => i.category_id === filterCategoryId);
  }, [items, filterCategoryId]);

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить товар?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("products").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить товар");
    } finally {
      setSaving(false);
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Без категории";
  }

  function getSubcategoryName(id: string | null) {
    if (!id) return "";
    return subcategories.find((s) => s.id === id)?.name ?? "";
  }

  function formatPrice(value: ProductRow["price"]) {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("ru-RU");
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Товары</h1>
          <p className="text-sm text-muted-foreground">
            Управление товарами каталога.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products/stock">Управление остатками</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/products/new${filterCategoryId ? `?category=${encodeURIComponent(filterCategoryId)}` : ""}`}>Новый товар</Link>
          </Button>
        </div>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border overflow-x-auto">
        <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">Список товаров</span>
          {categories.length > 0 ? (
            <select
              className="rounded-md border bg-background px-2 py-1 text-xs"
              value={filterCategoryId}
              onChange={(e) => {
                const newCategoryId = e.target.value;
                setFilterCategoryId(newCategoryId);
                // Обновляем URL с новым фильтром
                const params = new URLSearchParams(searchParams.toString());
                if (newCategoryId) {
                  params.set("category", newCategoryId);
                } else {
                  params.delete("category");
                }
                router.replace(`/admin/products?${params.toString()}`, { scroll: false });
              }}
              suppressHydrationWarning
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-7 w-24" />
          )}
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Товар</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Цена</th>
              <th className="px-3 py-2">Остаток</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2 min-w-[120px]">Популярный</th>
              <th className="px-3 py-2 min-w-[120px]">Под заказ</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Для этой категории ещё нет товаров.
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {row.main_image_url && (
                        <div className="h-10 w-16 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={row.main_image_url}
                            alt={row.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-medium">{row.name}</div>
                        {row.short_description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {row.short_description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {getCategoryName(row.category_id)}
                    {row.subcategory_id && (
                      <> / {getSubcategoryName(row.subcategory_id)}</>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    /product/{row.slug}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {formatPrice(row.price)} BYN
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {row.is_custom_order ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={
                          row.stock_quantity === null ||
                          row.stock_quantity === undefined
                            ? "text-muted-foreground"
                            : row.stock_quantity === 0
                            ? "text-red-600 font-medium"
                            : row.stock_quantity < 10
                            ? "text-orange-600 font-medium"
                            : "text-emerald-600"
                        }
                      >
                        {row.stock_quantity === null ||
                        row.stock_quantity === undefined
                          ? "—"
                          : row.stock_quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {row.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        Активен
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Скрыт
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs min-w-[120px]">
                    {row.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 whitespace-nowrap">
                        <span>★</span>
                        <span>Популярный</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {row.is_custom_order ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Под заказ
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon-sm" variant="outline">
                        <Link href={`/admin/products/${row.id}?category=${encodeURIComponent(filterCategoryId)}`}>✎</Link>
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
