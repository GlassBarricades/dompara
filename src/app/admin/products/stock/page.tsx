"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  price: number | null;
  main_image_url?: string | null;
}

interface StockOperation {
  product_id: string;
  type: "income" | "outcome";
  quantity: number;
  comment?: string;
}

export default function StockManagementPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [operationType, setOperationType] = useState<"income" | "outcome">(
    "income"
  );
  const [operationQuantity, setOperationQuantity] = useState("");
  const [operationComment, setOperationComment] = useState("");
  const [setStockDialogOpen, setSetStockDialogOpen] = useState(false);
  const [setStockProduct, setSetStockProduct] = useState<ProductRow | null>(
    null
  );
  const [setStockValue, setSetStockValue] = useState("");

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
          .select(
            "id, name, category_id, subcategory_id, stock_quantity, is_custom_order, price, main_image_url"
          )
          .order("name", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      setCategories((catRes.data ?? []) as CategoryOption[]);
      setProducts((prodRes.data ?? []) as ProductRow[]);

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
    let filtered = products.filter((p) => !p.is_custom_order);

    if (filterCategoryId) {
      filtered = filtered.filter((p) => p.category_id === filterCategoryId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

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

  async function handleStockOperation() {
    if (!canUseSupabase || !selectedProduct) return;

    const quantity = Number(operationQuantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть положительным числом");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      setError("Товар не найден");
      return;
    }

    const currentStock = product.stock_quantity ?? 0;
    let newStock: number;

    if (operationType === "income") {
      newStock = currentStock + quantity;
    } else {
      // outcome
      if (currentStock < quantity) {
        if (
          !window.confirm(
            `Текущий остаток: ${currentStock}. Списать ${quantity}? Остаток станет отрицательным (${
              currentStock - quantity
            }). Продолжить?`
          )
        ) {
          return;
        }
      }
      newStock = currentStock - quantity;
    }

    setSaving(true);
    setError(null);

    try {
      const oldStock = product.stock_quantity;

      const { error } = await supabase!
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", selectedProduct);

      if (error) throw error;

      // Записываем лог
      await logStockMovement(
        selectedProduct,
        oldStock,
        newStock,
        operationType,
        operationComment || undefined
      );

      // Обновляем локальное состояние
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct ? { ...p, stock_quantity: newStock } : p
        )
      );

      // Сброс формы
      setSelectedProduct(null);
      setOperationQuantity("");
      setOperationComment("");
      setOperationType("income");
    } catch (err) {
      console.error(err);
      setError("Не удалось выполнить операцию");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetStock(productId: string, newStock: number | null) {
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);

    try {
      const product = products.find((p) => p.id === productId);
      const oldStock = product?.stock_quantity ?? null;

      const { error } = await supabase!
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", productId);

      if (error) throw error;

      // Записываем лог
      await logStockMovement(
        productId,
        oldStock,
        newStock,
        "set",
        "Установка остатка вручную"
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock_quantity: newStock } : p
        )
      );

      setSetStockDialogOpen(false);
      setSetStockProduct(null);
      setSetStockValue("");
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить остаток");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenSetStockDialog(product: ProductRow) {
    setSetStockProduct(product);
    setSetStockValue(
      product.stock_quantity !== null && product.stock_quantity !== undefined
        ? String(product.stock_quantity)
        : ""
    );
    setSetStockDialogOpen(true);
  }

  function handleConfirmSetStock() {
    if (!setStockProduct) return;

    const stockValue = setStockValue.trim();
    const num = stockValue === "" ? null : Number(stockValue);

    if (stockValue !== "" && (Number.isNaN(num) || num === null || num < 0)) {
      setError("Введите неотрицательное число или оставьте пустым");
      return;
    }

    handleSetStock(setStockProduct.id, num);
  }

  const selectedProductData = selectedProduct
    ? products.find((p) => p.id === selectedProduct)
    : null;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Управление остатками</h1>
          <p className="text-sm text-muted-foreground">
            Вносите приходы и списания товаров, управляйте остатками на складе.
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Форма операции */}
      <div className="rounded-md border bg-background p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Операция с остатком</h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Товар</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedProduct || ""}
                onChange={(e) => setSelectedProduct(e.target.value || null)}
                disabled={saving}
              >
                <option value="">Выберите товар</option>
                {products
                  .filter((p) => !p.is_custom_order)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{" "}
                      {p.stock_quantity !== null &&
                      p.stock_quantity !== undefined
                        ? `(остаток: ${p.stock_quantity})`
                        : "(остаток не отслеживается)"}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Тип операции</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={operationType}
                onChange={(e) =>
                  setOperationType(e.target.value as "income" | "outcome")
                }
                disabled={saving || !selectedProduct}
              >
                <option value="income">Приход (увеличение)</option>
                <option value="outcome">Списание (уменьшение)</option>
              </select>
            </div>
          </div>

          {selectedProductData && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">
                Текущий остаток:{" "}
                {selectedProductData.stock_quantity !== null &&
                selectedProductData.stock_quantity !== undefined
                  ? selectedProductData.stock_quantity
                  : "не отслеживается"}
              </div>
              {operationQuantity &&
                !Number.isNaN(Number(operationQuantity)) && (
                  <div className="mt-1 text-muted-foreground">
                    После операции:{" "}
                    {operationType === "income"
                      ? (selectedProductData.stock_quantity ?? 0) +
                        Number(operationQuantity)
                      : (selectedProductData.stock_quantity ?? 0) -
                        Number(operationQuantity)}
                  </div>
                )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Количество</label>
              <input
                type="number"
                step="1"
                min="1"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={operationQuantity}
                onChange={(e) => setOperationQuantity(e.target.value)}
                placeholder="Введите количество"
                disabled={saving || !selectedProduct}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Комментарий (опционально)
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={operationComment}
                onChange={(e) => setOperationComment(e.target.value)}
                placeholder="Например: Поступление от поставщика"
                disabled={saving || !selectedProduct}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStockOperation}
              disabled={saving || !selectedProduct || !operationQuantity}
            >
              {saving
                ? "Выполнение..."
                : operationType === "income"
                ? "Внести приход"
                : "Выполнить списание"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProduct(null);
                setOperationQuantity("");
                setOperationComment("");
                setOperationType("income");
              }}
              disabled={saving}
            >
              Очистить
            </Button>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
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

      {/* Таблица товаров */}
      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Список товаров ({filteredProducts.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Товар</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Текущий остаток</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Товары не найдены.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t">
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
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          product.stock_quantity === null ||
                          product.stock_quantity === undefined
                            ? "text-muted-foreground"
                            : product.stock_quantity === 0
                            ? "text-red-600 font-medium"
                            : product.stock_quantity < 10
                            ? "text-orange-600 font-medium"
                            : "text-emerald-600"
                        }
                      >
                        {product.stock_quantity === null ||
                        product.stock_quantity === undefined
                          ? "—"
                          : product.stock_quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSetStockDialog(product)}
                        disabled={saving}
                      >
                        Установить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для установки остатка */}
      <Dialog open={setStockDialogOpen} onOpenChange={setSetStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Установить остаток для "{setStockProduct?.name}"
            </DialogTitle>
            <DialogDescription>
              Введите новое значение остатка. Оставьте пустым, если остаток не
              отслеживается.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Текущий остаток</label>
              <div className="text-sm text-muted-foreground">
                {setStockProduct?.stock_quantity !== null &&
                setStockProduct?.stock_quantity !== undefined
                  ? setStockProduct.stock_quantity
                  : "—"}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="stock-input" className="text-sm font-medium">
                Новый остаток
              </label>
              <input
                id="stock-input"
                type="number"
                step="1"
                min="0"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={setStockValue}
                onChange={(e) => setSetStockValue(e.target.value)}
                placeholder="Введите количество или оставьте пустым"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmSetStock();
                  }
                  if (e.key === "Escape") {
                    setSetStockDialogOpen(false);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSetStockDialogOpen(false);
                setSetStockProduct(null);
                setSetStockValue("");
              }}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button onClick={handleConfirmSetStock} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
