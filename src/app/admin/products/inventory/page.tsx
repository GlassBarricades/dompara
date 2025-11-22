'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  subcategory_id: string | null;
  stock_quantity: number | null;
  is_custom_order: boolean;
  main_image_url?: string | null;
}

interface InventoryItem {
  product_id: string;
  product_name: string;
  current_stock: number | null;
  new_stock: string;
  is_custom_order: boolean;
}

export default function InventoryPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Map<string, InventoryItem>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [catRes, prodRes] = await Promise.all([
        supabase!
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase!
          .from("products")
          .select("id, name, category_id, subcategory_id, stock_quantity, is_custom_order, main_image_url")
          .order("name", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      setCategories((catRes.data ?? []) as CategoryOption[]);
      const prods = (prodRes.data ?? []) as ProductRow[];
      setProducts(prods);

      // Инициализируем инвентаризацию для всех товаров (кроме под заказ)
      const items = new Map<string, InventoryItem>();
      prods.forEach((p) => {
        if (!p.is_custom_order) {
          items.set(p.id, {
            product_id: p.id,
            product_name: p.name,
            current_stock: p.stock_quantity,
            new_stock: p.stock_quantity !== null && p.stock_quantity !== undefined 
          ? String(p.stock_quantity) 
          : "",
            is_custom_order: false,
          });
        }
      });
      setInventoryItems(items);

      if (!filterCategoryId && (catRes.data?.length ?? 0) > 0) {
        setFilterCategoryId((catRes.data![0] as CategoryOption).id);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить товары/категории");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (filterCategoryId) {
      filtered = filtered.filter((p) => p.category_id === filterCategoryId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
    }

    // Показываем только товары, которые не под заказ
    filtered = filtered.filter((p) => !p.is_custom_order);

    return filtered;
  }, [products, filterCategoryId, searchQuery]);

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Без категории";
  }

  async function logStockMovement(
    productId: string,
    oldQuantity: number | null,
    newQuantity: number | null,
    movementType: "income" | "outcome" | "set" | "inventory",
    comment?: string
  ) {
    if (!canUseSupabase) return;

    try {
      await supabase!.from("stock_movements").insert({
        product_id: productId,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        movement_type: movementType,
        comment: comment || null,
      });
    } catch (err) {
      console.error("Failed to log stock movement:", err);
      // Не прерываем выполнение, если не удалось записать лог
    }
  }

  function handleStockChange(productId: string, value: string) {
    setInventoryItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(productId);
      if (item) {
        newMap.set(productId, { ...item, new_stock: value });
      }
      return newMap;
    });
  }

  async function handleSaveInventory() {
    if (!canUseSupabase) return;

    const updates: Array<{ id: string; stock_quantity: number | null }> = [];
    const errors: string[] = [];

    inventoryItems.forEach((item) => {
      const stockValue = item.new_stock.trim();
      let stockQuantity: number | null;

      if (stockValue === "") {
        stockQuantity = null;
      } else {
        const num = Number(stockValue);
        if (Number.isNaN(num) || num < 0) {
          errors.push(`${item.product_name}: неверное значение остатка`);
          return;
        }
        stockQuantity = num;
      }

      // Обновляем только если значение изменилось
      if (stockQuantity !== item.current_stock) {
        updates.push({
          id: item.product_id,
          stock_quantity: stockQuantity,
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (updates.length === 0) {
      setError("Нет изменений для сохранения");
      return;
    }

    if (!window.confirm(
      `Вы уверены, что хотите обновить остатки для ${updates.length} товар(ов)? Это действие перезапишет текущие остатки.`
    )) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Обновляем остатки пакетно и записываем логи
      for (const update of updates) {
        const item = inventoryItems.get(update.id);
        const oldStock = item?.current_stock ?? null;

        const { error } = await supabase!
          .from("products")
          .update({ stock_quantity: update.stock_quantity })
          .eq("id", update.id);

        if (error) {
          throw new Error(`Ошибка при обновлении товара ${update.id}: ${error.message}`);
        }

        // Записываем лог для каждого изменения
        await logStockMovement(
          update.id,
          oldStock,
          update.stock_quantity,
          "inventory",
          "Инвентаризация"
        );
      }

      setSuccess(`Успешно обновлено остатков: ${updates.length}`);
      
      // Перезагружаем данные
      await loadAll();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Не удалось сохранить инвентаризацию");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!window.confirm("Сбросить все изменения и вернуться к текущим остаткам?")) {
      return;
    }
    loadAll();
  }

  const hasChanges = useMemo(() => {
    for (const item of inventoryItems.values()) {
      const newStock = item.new_stock.trim() === "" 
        ? null 
        : Number(item.new_stock);
      if (newStock !== item.current_stock && !Number.isNaN(newStock)) {
        return true;
      }
    }
    return false;
  }, [inventoryItems]);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Инвентаризация</h1>
          <p className="text-sm text-muted-foreground">
            Проведите инвентаризацию и обновите остатки товаров на складе. Товары под заказ не отображаются.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products">Назад к товарам</Link>
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          {success}
        </div>
      )}

      {/* Панель управления */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-md border bg-background p-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Поиск по названию товара..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSaveInventory}
            disabled={saving || !hasChanges}
          >
            {saving ? "Сохранение..." : "Сохранить инвентаризацию"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving || !hasChanges}
          >
            Сбросить
          </Button>
        </div>
      </div>

      {/* Таблица инвентаризации */}
      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Список товаров для инвентаризации ({filteredProducts.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Товар</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Текущий остаток</th>
              <th className="px-3 py-2">Новый остаток</th>
              <th className="px-3 py-2">Изменение</th>
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
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Товары не найдены или все товары под заказ.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const item = inventoryItems.get(product.id);
                if (!item) return null;

                const currentStock = item.current_stock ?? 0;
                const newStockValue = item.new_stock.trim();
                const newStock = newStockValue === "" ? null : Number(newStockValue);
                const isValid = newStockValue === "" || (!Number.isNaN(newStock) && newStock !== null && newStock >= 0);
                const hasChange = newStock !== item.current_stock;

                return (
                  <tr 
                    key={product.id} 
                    className={`border-t ${hasChange && isValid ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {product.main_image_url && (
                          <div className="h-10 w-16 overflow-hidden rounded-md border bg-muted">
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {getCategoryName(product.category_id)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={
                        currentStock === 0
                          ? "text-red-600 font-medium"
                          : currentStock < 10
                          ? "text-orange-600 font-medium"
                          : "text-emerald-600"
                      }>
                        {item.current_stock !== null && item.current_stock !== undefined
                          ? item.current_stock
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className={`w-24 rounded-md border px-2 py-1 text-sm ${
                          !isValid ? 'border-red-500' : hasChange ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        value={item.new_stock}
                        onChange={(e) => handleStockChange(product.id, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {hasChange && isValid && (
                        <span className={
                          (newStock ?? 0) > currentStock
                            ? "text-emerald-600"
                            : (newStock ?? 0) < currentStock
                            ? "text-red-600"
                            : ""
                        }>
                          {(newStock ?? 0) > currentStock ? '+' : ''}
                          {((newStock ?? 0) - currentStock)}
                        </span>
                      )}
                      {!isValid && newStockValue !== "" && (
                        <span className="text-red-600 text-xs">Неверное значение</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

