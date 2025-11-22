"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface CatalogProductItem {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number | string | null;
  main_image_url?: string | null;
  stock_quantity?: number | null;
  is_custom_order?: boolean;
  is_featured?: boolean;
}

type SortKey =
  | "default"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

interface ProductGridWithFiltersProps {
  products: CatalogProductItem[];
}

export function ProductGridWithFilters({
  products,
}: ProductGridWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("default");

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    let list = products.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.short_description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const priceNumber = Number(p.price ?? 0);
      if (!Number.isFinite(priceNumber)) return false;
      if (min !== undefined && priceNumber < min) return false;
      if (max !== undefined && priceNumber > max) return false;
      return true;
    });

    switch (sort) {
      case "price_asc":
        list = [...list].sort(
          (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)
        );
        break;
      case "price_desc":
        list = [...list].sort(
          (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)
        );
        break;
      case "name_asc":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ru-RU"));
        break;
      case "name_desc":
        list = [...list].sort((a, b) => b.name.localeCompare(a.name, "ru-RU"));
        break;
      case "default":
      default:
        // оставляем исходный порядок
        break;
    }

    return list;
  }, [products, search, minPrice, maxPrice, sort]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Поиск по названию
            </label>
            <input
              type="text"
              placeholder="Например, печь, камни..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Цена от
              </label>
              <input
                type="number"
                min="0"
                className="w-24 rounded-md border bg-background px-2 py-2 text-xs"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                до
              </label>
              <input
                type="number"
                min="0"
                className="w-24 rounded-md border bg-background px-2 py-2 text-xs"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 md:w-auto md:flex-col md:items-end">
          <div className="text-xs text-muted-foreground">
            Найдено:{" "}
            <span className="font-semibold text-foreground">
              {processed.length}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Сортировка
            </label>
            <select
              className="w-full rounded-md border bg-background px-2 py-2 text-xs"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="default">По умолчанию</option>
              <option value="price_asc">Сначала дешёвые</option>
              <option value="price_desc">Сначала дорогие</option>
              <option value="name_asc">По названию A–Я</option>
              <option value="name_desc">По названию Я–A</option>
            </select>
          </div>
        </div>
      </div>

      {processed.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          По текущим фильтрам ничего не найдено. Попробуйте сбросить поиск или
          изменить диапазон цен.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processed.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="relative flex flex-col rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
            >
              {/* Бейджи */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                {product.is_featured && (
                  <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white dark:bg-amber-600 dark:text-white">
                    ⭐ Популярный
                  </span>
                )}
                {product.is_custom_order && (
                  <span className="inline-flex items-center rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white dark:bg-purple-600 dark:text-white">
                    📦 Под заказ
                  </span>
                )}
              </div>

              <div className="mb-3 flex h-56 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Нет изображения
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Товар
                </div>
                <div className="font-medium">{product.name}</div>
              </div>
              <div className="mt-3 space-y-2">
                {/* Остатки */}
                {!product.is_custom_order &&
                  product.stock_quantity !== null &&
                  product.stock_quantity !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Остаток:{" "}
                      <span
                        className={`font-medium ${
                          product.stock_quantity === 0
                            ? "text-red-600"
                            : product.stock_quantity < 10
                            ? "text-orange-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {product.stock_quantity} шт.
                      </span>
                    </div>
                  )}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>
                    {Number(product.price ?? 0).toLocaleString("ru-RU")} BYN
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary text-xs text-primary"
                  >
                    Подробнее
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
