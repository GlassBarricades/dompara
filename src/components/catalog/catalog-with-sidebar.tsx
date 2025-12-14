"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CatalogTree } from "@/components/catalog/catalog-tree";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { QuickViewModal } from "@/components/product/quick-view-modal";
import { MobileFiltersDrawer } from "@/components/catalog/mobile-filters-drawer";
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
  verticalCardLayout?: boolean;
}

type ViewMode = "grid" | "list";
const ITEMS_PER_PAGE = 12;

export function CatalogWithSidebar({
  header,
  tree,
  products,
  filterAttributes = [],
  attributeValues = [],
  activeCategorySlug,
  activeSubcategorySlug,
  verticalCardLayout = false,
}: CatalogWithSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Читаем фильтры из URL
  const urlSearch = searchParams.get("search") || "";
  const urlMinPrice = searchParams.get("minPrice") || "";
  const urlMaxPrice = searchParams.get("maxPrice") || "";
  const urlSort = (searchParams.get("sort") as SortKey) || "default";
  const urlView = (searchParams.get("view") as ViewMode) || "grid";
  const urlPage = Number(searchParams.get("page")) || 1;

  // Восстанавливаем фильтры по атрибутам из URL
  const urlSelectedAttrs = useMemo(() => {
    const attrs: Record<string, AttrFilterState> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("attr_")) {
        const attrId = key.replace("attr_", "");
        // Поддерживаем разные форматы значений
        if (value.includes(",")) {
          // Множественный выбор (массив значений)
          attrs[attrId] = {
            type: "multiselect",
            value: value.split(",").filter(Boolean),
          };
        } else if (value === "true" || value === "false") {
          // Булево значение
          attrs[attrId] = {
            type: "boolean",
            value: value as "true" | "false",
          };
        } else if (value.includes("-")) {
          // Числовой диапазон (min-max)
          const [min, max] = value.split("-").map(Number);
          attrs[attrId] = {
            type: "number",
            value: { min: isNaN(min) ? undefined : min, max: isNaN(max) ? undefined : max },
          };
        } else if (value) {
          // Одиночное значение
          attrs[attrId] = {
            type: "select",
            value: [value],
          };
        }
      }
    });
    return attrs;
  }, [searchParams]);

  const [search, setSearch] = useState(urlSearch);
  const [minPrice, setMinPrice] = useState<string>(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState<string>(urlMaxPrice);
  const [sort, setSort] = useState<SortKey>(urlSort);
  const [viewMode, setViewMode] = useState<ViewMode>(urlView);
  const [currentPage, setCurrentPage] = useState(urlPage);

  const [selectedAttrs, setSelectedAttrs] = useState<
    Record<string, AttrFilterState>
  >(urlSelectedAttrs);

  // Состояние для модального окна быстрого просмотра
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  
  // Состояние для мобильного drawer с фильтрами
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Синхронизация с URL
  useEffect(() => {
    setSearch(urlSearch);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setSort(urlSort);
    setViewMode(urlView);
    setCurrentPage(urlPage);
    setSelectedAttrs(urlSelectedAttrs);
  }, [urlSearch, urlMinPrice, urlMaxPrice, urlSort, urlView, urlPage, urlSelectedAttrs]);

  // Вычисляем диапазон цен для slider
  const priceRange = useMemo(() => {
    const prices = products
      .map((p) => Number(p.price ?? 0))
      .filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  // Обновление URL при изменении фильтров
  const updateURL = (updates: Record<string, string | number | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "default" || value === "grid") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    // Сбрасываем страницу при изменении фильтров (но не при изменении самой страницы)
    if (resetPage && !("page" in updates)) {
      params.delete("page");
    } else if ("page" in updates) {
      // При изменении страницы сохраняем её в URL (кроме страницы 1, которую можно не показывать)
      if (updates.page === null || updates.page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(updates.page));
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Обновление URL для фильтров по атрибутам
  const updateAttrsURL = (attrs: Record<string, AttrFilterState>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Удаляем все старые параметры атрибутов
    searchParams.forEach((_, key) => {
      if (key.startsWith("attr_")) {
        params.delete(key);
      }
    });
    
    // Добавляем новые параметры атрибутов
    Object.entries(attrs).forEach(([attrId, filter]) => {
      if (!filter) return;
      
      const paramKey = `attr_${attrId}`;
      
      if (filter.type === "multiselect" || filter.type === "select" || filter.type === "string") {
        const values = Array.isArray(filter.value) ? filter.value : [];
        if (values.length > 0) {
          params.set(paramKey, values.join(","));
        }
      } else if (filter.type === "boolean") {
        if (filter.value !== "all") {
          params.set(paramKey, filter.value);
        }
      } else if (filter.type === "number") {
        const min = filter.value?.min;
        const max = filter.value?.max;
        if (typeof min === "number" || typeof max === "number") {
          params.set(paramKey, `${min ?? ""}-${max ?? ""}`);
        }
      }
    });
    
    params.delete("page"); // Сбрасываем страницу при изменении фильтров
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Подсчет активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (sort !== "default") count++;
    const activeAttrFilters = Object.entries(selectedAttrs).filter(
      ([, v]) =>
        v &&
        ((v.type === "multiselect" &&
          Array.isArray(v.value) &&
          v.value.length) ||
          (v.type === "select" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "string" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "boolean" && v.value !== "all") ||
          (v.type === "number" &&
            v.value &&
            (typeof v.value.min === "number" ||
              typeof v.value.max === "number")))
    );
    count += activeAttrFilters.length;
    return count;
  }, [search, minPrice, maxPrice, sort, selectedAttrs]);

  // Получение чипов активных фильтров
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    
    if (search.trim()) {
      chips.push({
        id: "search",
        label: `Поиск: "${search}"`,
        onRemove: () => {
          setSearch("");
          updateURL({ search: null });
        },
      });
    }
    if (minPrice) {
      chips.push({
        id: "minPrice",
        label: `От ${minPrice} BYN`,
        onRemove: () => {
          setMinPrice("");
          updateURL({ minPrice: null });
        },
      });
    }
    if (maxPrice) {
      chips.push({
        id: "maxPrice",
        label: `До ${maxPrice} BYN`,
        onRemove: () => {
          setMaxPrice("");
          updateURL({ maxPrice: null });
        },
      });
    }
    if (sort !== "default") {
      const sortLabels: Record<SortKey, string> = {
        default: "По умолчанию",
        price_asc: "Сначала дешёвые",
        price_desc: "Сначала дорогие",
        name_asc: "По названию A–Я",
        name_desc: "По названию Я–A",
      };
      chips.push({
        id: "sort",
        label: sortLabels[sort],
        onRemove: () => {
          setSort("default");
          updateURL({ sort: null });
        },
      });
    }

    // Чипы для атрибутов
    Object.entries(selectedAttrs).forEach(([attrId, filter]) => {
      const attr = filterAttributes.find((a) => a.id === attrId);
      if (!attr) return;

      if (
        (filter.type === "select" || filter.type === "string") &&
        Array.isArray(filter.value) &&
        filter.value.length > 0
      ) {
        filter.value.forEach((val) => {
          const option = Array.isArray(attr.options)
            ? attr.options.find((o: any) => o.value === val)
            : null;
          chips.push({
            id: `${attrId}-${val}`,
            label: `${attr.name}: ${option?.label ?? val}`,
            onRemove: () => {
              setSelectedAttrs((prev) => {
                const next = { ...prev };
                const current = next[attrId] as AttrFilterState | undefined;
                if (current && (current.type === "select" || current.type === "multiselect" || current.type === "string")) {
                  const newValues = current.value.filter((v) => v !== val);
                  if (newValues.length === 0) {
                    delete next[attrId];
                  } else {
                    next[attrId] = { ...current, value: newValues } as AttrFilterState;
                  }
                }
                updateAttrsURL(next);
                return next;
              });
            },
          });
        });
      }
    });

    return chips;
  }, [search, minPrice, maxPrice, sort, selectedAttrs, filterAttributes]);

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    // подготовим карту значений атрибутов по товарам
    const valuesByProduct = new Map<string, Map<string, any>>();

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
        ((v.type === "multiselect" &&
          Array.isArray(v.value) &&
          v.value.length) ||
          (v.type === "select" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "string" && Array.isArray(v.value) && v.value.length) ||
          (v.type === "boolean" && v.value !== "all") ||
          (v.type === "number" &&
            v.value &&
            (typeof v.value.min === "number" ||
              typeof v.value.max === "number")))
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
  }, [
    products,
    search,
    minPrice,
    maxPrice,
    sort,
    selectedAttrs,
    attributeValues,
  ]);

  // Пагинация
  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processed.slice(start, start + ITEMS_PER_PAGE);
  }, [processed, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page }, false); // Не сбрасываем страницу, так как мы её изменяем
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderAttributeFilters = () => {
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
                                  const prevEntry = next[key] as
                                    | AttrFilterState
                                    | undefined;
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
                                      values = values.filter(
                                        (v) => v !== value
                                      );
                                    }
                                  } else {
                                    values = e.target.checked ? [value] : [];
                                  }
                                  next[key] = {
                                    type: multiple ? "multiselect" : "select",
                                    value: values,
                                  };
                                  updateAttrsURL(next);
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
                current && current.type === "boolean" ? current.value : "all";
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
                      const next: Record<string, AttrFilterState> = { ...selectedAttrs, [key]: { type: "boolean", value } };
                      setSelectedAttrs(next);
                      updateAttrsURL(next);
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
                    .filter(
                      (v) => v.attribute_id === attr.id && v.value != null
                    )
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
                                const prevEntry = next[key] as
                                  | AttrFilterState
                                  | undefined;
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
                                updateAttrsURL(next);
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
  };

  // Обработчики для мобильного drawer
  const handleResetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("default");
    setSelectedAttrs({});
    setCurrentPage(1);
    updateAttrsURL({});
    updateURL({
      search: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      page: null,
    });
  };

  return (
    <>
      {/* Липкая кнопка фильтров для мобильных */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
        <Button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full shadow-lg h-12 text-base font-medium"
          size="lg"
        >
          <span className="mr-2">🔍</span>
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background px-1.5 text-xs font-semibold text-primary">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="hidden md:block space-y-4">
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
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                onClick={() => {
                  setSearch("");
                  setMinPrice("");
                  setMaxPrice("");
                  setSort("default");
                  setSelectedAttrs({});
                  setCurrentPage(1);
                  updateAttrsURL({});
                  updateURL({
                    search: null,
                    minPrice: null,
                    maxPrice: null,
                    sort: null,
                    page: null,
                  });
                }}
                disabled={activeFiltersCount === 0}
              >
                Сбросить все
              </button>
            </div>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateURL({ search: e.target.value || null, page: null });
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Цена</span>
                <span className="font-medium">
                  {minPrice || priceRange.min} - {maxPrice || priceRange.max} BYN
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  step="10"
                  value={minPrice || priceRange.min}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinPrice(val);
                    updateURL({ minPrice: val, page: null });
                  }}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      От
                    </label>
                    <input
                      type="number"
                      min={priceRange.min}
                      max={priceRange.max}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      value={minPrice || priceRange.min}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMinPrice(val);
                        updateURL({ minPrice: val || null, page: null });
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      До
                    </label>
                    <input
                      type="number"
                      min={priceRange.min}
                      max={priceRange.max}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      value={maxPrice || priceRange.max}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMaxPrice(val);
                        updateURL({ maxPrice: val || null, page: null });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Сортировка
              </label>
              <select
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                value={sort}
                onChange={(e) => {
                  const newSort = e.target.value as SortKey;
                  setSort(newSort);
                  updateURL({ sort: newSort === "default" ? null : newSort, page: null });
                }}
              >
                <option value="default">По умолчанию</option>
                <option value="price_asc">Сначала дешёвые</option>
                <option value="price_desc">Сначала дорогие</option>
                <option value="name_asc">По названию A–Я</option>
                <option value="name_desc">По названию Я–A</option>
              </select>
            </div>

          </div>

          {renderAttributeFilters()}
        </div>
      </aside>

      <div className="space-y-4 pb-20 md:pb-4">
        {header}

        {/* Чипы активных фильтров */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Активные фильтры:</span>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs hover:bg-accent transition-colors"
              >
                {chip.label}
                <span className="text-muted-foreground">×</span>
              </button>
            ))}
          </div>
        )}

        {/* Панель управления видом и сортировкой */}
        {processed.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Найдено: <span className="font-semibold text-foreground">{processed.length}</span> товаров
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Вид:</span>
              <div className="flex rounded-md border">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("grid");
                    updateURL({ view: "grid" });
                  }}
                  className={`px-2 py-1 text-xs transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  ☷ Сетка
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    updateURL({ view: "list" });
                  }}
                  className={`px-2 py-1 text-xs transition-colors rounded-r-md ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  ☰ Список
                </button>
              </div>
            </div>
          </div>
        )}

        {processed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            По текущим фильтрам ничего не найдено. Попробуйте изменить запрос
            или диапазон цен.
          </p>
        ) : (
          <>
            <div className={viewMode === "grid" 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
            }>
              {paginatedProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className={`relative flex rounded-lg border bg-background p-4 transition-all duration-200 hover:bg-accent hover:shadow-md ${
                  viewMode === "grid"
                    ? "flex-col hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    : "flex-row gap-4"
                }`}
                style={
                  viewMode === "grid"
                    ? {
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "both",
                      }
                    : undefined
                }
              >
                {/* Бейджи */}
                <div className={`absolute z-10 flex flex-col gap-1 ${
                  viewMode === "grid" ? "top-2 right-2" : "top-2 right-2"
                }`}>
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

                <div className={`relative flex items-center justify-center overflow-hidden rounded-md border bg-muted ${
                  viewMode === "grid"
                    ? verticalCardLayout
                      ? "mb-3 h-80 w-full"
                      : "mb-3 h-56 w-full"
                    : "h-32 w-32 flex-shrink-0"
                }`}>
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className={viewMode === "grid" ? "h-full w-full object-cover" : "h-full w-full object-cover"}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Нет изображения
                    </span>
                  )}
                  {/* Кнопка быстрого просмотра (только для grid view) */}
                  {viewMode === "grid" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuickViewSlug(product.slug);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity group"
                      aria-label="Быстрый просмотр"
                    >
                      <span className="rounded-md bg-background px-3 py-1.5 text-xs font-medium shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        👁 Быстрый просмотр
                      </span>
                    </button>
                  )}
                </div>
                <div className={`flex-1 space-y-1 ${viewMode === "list" ? "min-w-0" : ""}`}>
                  {viewMode === "grid" && (
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Товар
                    </div>
                  )}
                  <div className={`font-medium ${viewMode === "list" ? "text-lg" : ""}`}>
                    {product.name}
                  </div>
                  {viewMode === "list" && product.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.short_description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                  <div className={`mt-3 space-y-2 ${viewMode === "list" ? "flex flex-wrap items-center justify-between" : ""}`}>
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
                    <div className={`flex flex-wrap items-center justify-between text-sm font-semibold ${viewMode === "list" ? "gap-4" : "flex-col gap-2"}`}>
                      <span className={viewMode === "list" ? "text-lg" : ""}>
                        {Number(product.price ?? 0).toLocaleString("ru-RU")} BYN
                      </span>
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-primary text-xs text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuickViewSlug(product.slug);
                          }}
                        >
                          👁 Быстрый просмотр
                        </Button>
                        <span className="inline-flex items-center justify-center rounded-md border border-primary bg-background px-3 py-1.5 text-xs font-medium text-primary flex-1">
                          Подробнее
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="min-w-[2.5rem]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </Button>
            </div>
          )}
        </>
        )}
      </div>
      </div>

      {/* Модальное окно быстрого просмотра */}
      <QuickViewModal
        productSlug={quickViewSlug}
        isOpen={quickViewSlug !== null}
        onClose={() => setQuickViewSlug(null)}
      />

      {/* Мобильный drawer с фильтрами */}
      <MobileFiltersDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        tree={tree}
        filterAttributes={filterAttributes}
        attributeValues={attributeValues}
        activeCategorySlug={activeCategorySlug}
        activeSubcategorySlug={activeSubcategorySlug}
        search={search}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        selectedAttrs={selectedAttrs}
        priceRange={priceRange}
        activeFiltersCount={activeFiltersCount}
        onSearchChange={(value) => {
          setSearch(value);
          updateURL({ search: value || null, page: null });
        }}
        onMinPriceChange={(value) => {
          setMinPrice(value);
          updateURL({ minPrice: value || null, page: null });
        }}
        onMaxPriceChange={(value) => {
          setMaxPrice(value);
          updateURL({ maxPrice: value || null, page: null });
        }}
        onSortChange={(value) => {
          setSort(value);
          updateURL({ sort: value === "default" ? null : value, page: null });
        }}
        onSelectedAttrsChange={(attrs) => {
          setSelectedAttrs(attrs);
          updateAttrsURL(attrs);
        }}
        onResetFilters={handleResetFilters}
      />
    </>
  );
}
