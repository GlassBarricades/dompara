"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CatalogTree } from "@/components/catalog/catalog-tree";
import type {
  CatalogCategoryNode,
  FilterableAttributeDefinition,
  ProductAttributeValueRow,
} from "@/lib/catalog-api";

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

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tree: CatalogCategoryNode[];
  filterAttributes: FilterableAttributeDefinition[];
  attributeValues: ProductAttributeValueRow[];
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
  // Состояния фильтров
  search: string;
  minPrice: string;
  maxPrice: string;
  sort: SortKey;
  selectedAttrs: Record<string, AttrFilterState>;
  priceRange: { min: number; max: number };
  activeFiltersCount: number;
  // Обработчики
  onSearchChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
  onSelectedAttrsChange: (attrs: Record<string, AttrFilterState>) => void;
  onResetFilters: () => void;
}

export function MobileFiltersDrawer({
  isOpen,
  onClose,
  tree,
  filterAttributes,
  attributeValues,
  activeCategorySlug,
  activeSubcategorySlug,
  search,
  minPrice,
  maxPrice,
  sort,
  selectedAttrs,
  priceRange,
  activeFiltersCount,
  onSearchChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onSelectedAttrsChange,
  onResetFilters,
}: MobileFiltersDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
                                const prevEntry = selectedAttrs[key] as
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
                                    values = values.filter((v) => v !== value);
                                  }
                                } else {
                                  values = e.target.checked ? [value] : [];
                                }
                                onSelectedAttrsChange({
                                  ...selectedAttrs,
                                  [key]: {
                                    type: multiple ? "multiselect" : "select",
                                    value: values,
                                  },
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
                      onSelectedAttrsChange({
                        ...selectedAttrs,
                        [key]: { type: "boolean", value },
                      });
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
                              const prevEntry = selectedAttrs[key] as
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
                              onSelectedAttrsChange({
                                ...selectedAttrs,
                                [key]: {
                                  type: "string",
                                  value: values,
                                },
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
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-background shadow-xl animate-in slide-in-from-left duration-300 md:hidden overflow-y-auto">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Фильтры</h2>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="touch-manipulation"
            >
              ✕
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4">
            {/* Дерево каталога */}
            <div className="border-b pb-4">
              <CatalogTree
                tree={tree}
                activeCategorySlug={activeCategorySlug}
                activeSubcategorySlug={activeSubcategorySlug}
              />
            </div>

            {/* Фильтры */}
            <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Фильтры
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                  onClick={onResetFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Сбросить все
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
                    onChange={(e) => onSearchChange(e.target.value)}
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
                      onChange={(e) => onMinPriceChange(e.target.value)}
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
                          onChange={(e) => onMinPriceChange(e.target.value || "")}
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
                          onChange={(e) => onMaxPriceChange(e.target.value || "")}
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
                    onChange={(e) => onSortChange(e.target.value as SortKey)}
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
          </div>
        </div>
      </div>
    </>
  );
}

