'use client';

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CatalogTree } from "@/components/catalog/catalog-tree";
import type {
  CatalogCategoryNode,
  FilterableAttributeDefinition,
  ProductAttributeValueRow,
} from "@/lib/catalog-api";

export interface CatalogProductItem {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number | string | null;
  main_image_url?: string | null;
}

type SortKey = "default" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

type AttrFilterState =
  | { type: "select" | "multiselect" | "string"; value: string[] }
  | { type: "boolean"; value: "all" | "true" | "false" }
  | { type: "number"; value: { min?: number; max?: number } };

interface CatalogWithSidebarProps {
  header: ReactNode;
  tree: CatalogCategoryNode[];
  products: CatalogProductItem[];
  filterAttributes?: FilterableAttributeDefinition[];
  attributeValues?: ProductAttributeValueRow[];
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
}

export function CatalogWithSidebar({
  header,
  tree,
  products,
  filterAttributes = [],
  attributeValues = [],
  activeCategorySlug,
  activeSubcategorySlug,
}: CatalogWithSidebarProps) {
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("default");

  const [selectedAttrs, setSelectedAttrs] = useState<
    Record<string, AttrFilterState>
  >({});

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    // подготовим карту значений атрибутов по товарам
    const valuesByProduct = new Map<
      string,
      Map<string, any>
    >();

    attributeValues.forEach((row) => {
      let byAttr = valuesByProduct.get(row.product_id);
      if (!byAttr) {
        byAttr = new Map();
        valuesByProduct.set(row.product_id, byAttr);
      }
      byAttr.set(row.attribute_id, row.value);
    });

    const activeAttrFilters = Object.entries(selectedAttrs).filter(
      ([, v]) =>
        v &&
        ((v.type === "multiselect" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "select" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "string" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "boolean" && v.value !== "all") ||
          (v.type === "number" &&
            v.value &&
            (typeof v.value.min === "number" || typeof v.value.max === "number")))
    );

    let list = products.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.short_description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const priceNumber = Number(p.price ?? 0);
      if (!Number.isFinite(priceNumber)) return false;
      if (min !== undefined && priceNumber < min) return false;
      if (max !== undefined && priceNumber > max) return false;
      // фильтрация по атрибутам
      if (activeAttrFilters.length === 0) return true;

      const productValues = valuesByProduct.get(p.id);
      if (!productValues) return false;

      for (const [attrId, filter] of activeAttrFilters) {
        const raw = productValues.get(attrId);
        if (filter.type === "select" || filter.type === "string") {
          const selected: string[] = filter.value ?? [];
          if (!selected.length) continue;
          const rawStr = raw == null ? "" : String(raw);
          if (!selected.includes(rawStr)) return false;
        } else if (filter.type === "multiselect") {
          const selected: string[] = filter.value ?? [];
          if (!selected.length) continue;
          const rawArr = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const hasIntersection = selected.some((v) =>
            rawArr.map(String).includes(String(v))
          );
          if (!hasIntersection) return false;
        } else if (filter.type === "boolean") {
          if (filter.value === "all") continue;
          const boolVal = Boolean(raw);
          if (
            (filter.value === "true" && !boolVal) ||
            (filter.value === "false" && boolVal)
          ) {
            return false;
          }
        } else if (filter.type === "number") {
          const numeric = Number(raw);
          if (!Number.isFinite(numeric)) return false;
          const { min: fmin, max: fmax } = filter.value || {};
          if (typeof fmin === "number" && numeric < fmin) return false;
          if (typeof fmax === "number" && numeric > fmax) return false;
        }
      }

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
        break;
    }

    return list;
  }, [products, search, minPrice, maxPrice, sort]);

  function renderAttributeFilters() {
    if (!filterAttributes || filterAttributes.length === 0) return null;

    return (
      <div className="space-y-3 border-t pt-3 mt-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Характеристики
        </div>
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {filterAttributes.map((attr) => {
            const key = attr.id;
            const current = selectedAttrs[key];

            if (
              attr.data_type === "select" ||
              attr.data_type === "multiselect"
            ) {
              const multiple = attr.data_type === "multiselect";
              const selectedValues: string[] =
                (current?.value as string[]) ?? [];

              return (
                <div key={attr.id} className="space-y-1">
                  <div className="text-xs font-medium text-foreground">
                    {attr.name}
                  </div>
                  <div className="space-y-1">
                    {Array.isArray(attr.options) &&
                      attr.options.map((opt: any) => {
                        const value = String(opt.value);
                        const checked = multiple
                          ? selectedValues.includes(value)
                          : selectedValues[0] === value;
                        return (
                          <label
                            key={value}
                            className="flex items-center gap-2 text-[11px] text-muted-foreground"
                          >
                            <input
                              type="checkbox"
                              className="h-3 w-3 rounded border"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedAttrs((prev) => {
                                  const next = { ...prev };
                                  const prevEntry = next[key] as AttrFilterState | undefined;
                                  let values: string[] =
                                    prevEntry && Array.isArray(prevEntry.value)
                                      ? [...(prevEntry.value as string[])]
                                      : [];
                                  if (multiple) {
                                    if (e.target.checked) {
                                      if (!values.includes(value)) {
                                        values.push(value);
                                      }
                                    } else {
                                      values = values.filter((v) => v !== value);
                                    }
                                  } else {
                                    values = e.target.checked ? [value] : [];
                                  }
                                  next[key] = {
                                    type: multiple
                                      ? "multiselect"
                                      : "select",
                                    value: values,
                                  };
                                  return next;
                                });
                              }}
                            />
                            <span>{opt.label ?? opt.value}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              );
            }

            if (attr.data_type === "boolean") {
              const val: "all" | "true" | "false" =
                current && current.type === "boolean"
                  ? current.value
                  : "all";
              return (
                <div key={attr.id} className="space-y-1">
                  <div className="text-xs font-medium text-foreground">
                    {attr.name}
                  </div>
                  <select
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    value={val}
                    onChange={(e) => {
                      const value = e.target.value as "all" | "true" | "false";
                      setSelectedAttrs((prev) => ({
                        ...prev,
                        [key]: { type: "boolean", value },
                      }));
                    }}
                  >
                    <option value="all">Любое</option>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                </div>
              );
            }

            if (attr.data_type === "string") {
              const allValues = Array.from(
                new Set(
                  attributeValues
                    .filter((v) => v.attribute_id === attr.id && v.value != null)
                    .map((v) => String(v.value))
                )
              );
              if (allValues.length === 0) return null;

              const selectedValues: string[] =
                (current?.value as string[]) ?? [];

              return (
                <div key={attr.id} className="space-y-1">
                  <div className="text-xs font-medium text-foreground">
                    {attr.name}
                  </div>
                  <div className="space-y-1">
                    {allValues.map((value) => {
                      const checked = selectedValues.includes(value);
                      return (
                        <label
                          key={value}
                          className="flex items-center gap-2 text-[11px] text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            className="h-3 w-3 rounded border"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedAttrs((prev) => {
                                const next = { ...prev };
                                const prevEntry = next[key] as AttrFilterState | undefined;
                                let values: string[] =
                                  prevEntry && Array.isArray(prevEntry.value)
                                    ? [...(prevEntry.value as string[])]
                                    : [];
                                if (e.target.checked) {
                                  if (!values.includes(value)) {
                                    values.push(value);
                                  }
                                } else {
                                  values = values.filter((v) => v !== value);
                                }
                                next[key] = {
                                  type: "string",
                                  value: values,
                                };
                                return next;
                              });
                            }}
                          />
                          <span>{value}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px,minmax(0,1fr)]">
      <aside className="space-y-4">
        <CatalogTree
          tree={tree}
          activeCategorySlug={activeCategorySlug}
          activeSubcategorySlug={activeSubcategorySlug}
        />

        <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Фильтры
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setSearch("");
                setMinPrice("");
                setMaxPrice("");
                setSort("default");
                setSelectedAttrs({});
              }}
            >
              Сбросить
            </button>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Поиск по названию
              </label>
              <input
                type="text"
                placeholder="Например, печь, камни..."
                className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Цена от
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  до
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Сортировка
              </label>
              <select
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
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

            <div className="pt-1 text-xs text-muted-foreground">
              Найдено{" "}
              <span className="font-semibold text-foreground">
                {processed.length}
              </span>
            </div>
          </div>

          {renderAttributeFilters()}
        </div>
      </aside>

      <div className="space-y-4">
        {header}

        {processed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            По текущим фильтрам ничего не найдено. Попробуйте изменить запрос или
            диапазон цен.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processed.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="flex flex-col rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
              >
                <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-md border bg-muted">
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
                  {product.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.short_description}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold">
                  <span>
                    {Number(product.price ?? 0).toLocaleString("ru-RU")} ₽
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary text-xs text-primary"
                  >
                    Подробнее
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


