'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface ProductOption {
  id: string;
  name: string;
  stock_quantity: number | null;
  is_custom_order: boolean;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: string;
  price: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadProducts() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("products")
        .select("id, name, stock_quantity, is_custom_order")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      // Фильтруем товары под заказ
      const filteredProducts = (data ?? []).filter(
        (p: any) => !p.is_custom_order
      ) as ProductOption[];

      setProducts(filteredProducts);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }

  function handleAddItem() {
    if (!selectedProductId || !newItemQuantity) {
      setError("Выберите товар и укажите количество");
      return;
    }

    const quantity = Number(newItemQuantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть положительным числом");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      setError("Товар не найден");
      return;
    }

    // Проверяем, не добавлен ли уже этот товар
    if (items.some((item) => item.product_id === selectedProductId)) {
      setError("Этот товар уже добавлен в накладную");
      return;
    }

    const price = newItemPrice.trim() ? Number(newItemPrice) : null;
    if (newItemPrice.trim() && (Number.isNaN(price) || price === null || price < 0)) {
      setError("Цена должна быть неотрицательным числом");
      return;
    }

    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      product_id: selectedProductId,
      product_name: product.name,
      quantity: newItemQuantity,
      price: newItemPrice.trim() || "",
    };

    setItems([...items, newItem]);
    setSelectedProductId("");
    setNewItemQuantity("");
    setNewItemPrice("");
    setError(null);
  }

  function handleRemoveItem(itemId: string) {
    setItems(items.filter((item) => item.id !== itemId));
  }

  function handleUpdateItemQuantity(itemId: string, quantity: string) {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  function handleUpdateItemPrice(itemId: string, price: string) {
    setItems(
      items.map((item) => (item.id === itemId ? { ...item, price } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!invoiceNumber.trim()) {
      setError("Укажите номер накладной");
      return;
    }

    if (items.length === 0) {
      setError("Добавьте хотя бы один товар в накладную");
      return;
    }

    // Валидация всех позиций
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        setError(`Неверное количество для товара "${item.product_name}"`);
        return;
      }

      if (item.price.trim()) {
        const price = Number(item.price);
        if (Number.isNaN(price) || price < 0) {
          setError(`Неверная цена для товара "${item.product_name}"`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Создаем накладную
      const { data: invoiceData, error: invoiceError } = await supabase!
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber.trim(),
          supplier_name: supplierName.trim() || null,
          invoice_date: invoiceDate,
          comment: comment.trim() || null,
        })
        .select("id")
        .single();

      if (invoiceError) {
        if (invoiceError.code === '23505') {
          throw new Error("Накладная с таким номером уже существует");
        }
        throw invoiceError;
      }

      const invoiceId = invoiceData.id;

      // Создаем позиции накладной
      const invoiceItems = items.map((item) => ({
        invoice_id: invoiceId,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        price: item.price.trim() ? Number(item.price) : null,
      }));

      const { error: itemsError } = await supabase!
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Применяем приходы к остаткам и логируем
      for (const item of items) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) continue;

        const oldStock = product.stock_quantity ?? 0;
        const newStock = oldStock + Number(item.quantity);

        // Обновляем остаток
        const { error: updateError } = await supabase!
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product_id);

        if (updateError) {
          console.error(`Failed to update stock for product ${item.product_id}:`, updateError);
          continue;
        }

        // Логируем изменение
        await supabase!.from("stock_movements").insert({
          product_id: item.product_id,
          old_quantity: oldStock,
          new_quantity: newStock,
          movement_type: "income",
          comment: `Приход по накладной ${invoiceNumber}`,
        });
      }

      router.push("/admin/products/invoices");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить накладную"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Новая накладная</h1>
          <p className="text-sm text-muted-foreground">
            Введите данные накладной и добавьте товары для прихода на склад.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products/invoices">Назад к накладным</Link>
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
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация о накладной */}
        <div className="rounded-md border bg-background p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">Информация о накладной</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Номер накладной <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="НВ-2024-001"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Дата накладной</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Поставщик</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Название поставщика"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Комментарий</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительная информация о накладной"
            />
          </div>
        </div>

        {/* Добавление товаров */}
        <div className="rounded-md border bg-background p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">Товары в накладной</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Товар</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={loading}
              >
                <option value="">Выберите товар</option>
                {products
                  .filter(
                    (p) => !items.some((item) => item.product_id === p.id)
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Количество <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Цена за единицу</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={loading || !selectedProductId || !newItemQuantity}
                className="w-full"
              >
                Добавить
              </Button>
            </div>
          </div>

          {/* Список добавленных товаров */}
          {items.length > 0 && (
            <div className="mt-4 rounded-md border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Товар</th>
                    <th className="px-3 py-2">Количество</th>
                    <th className="px-3 py-2">Цена</th>
                    <th className="px-3 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-3 font-medium">{item.product_name}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          className="w-24 rounded-md border px-2 py-1 text-sm"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemQuantity(item.id, e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-32 rounded-md border px-2 py-1 text-sm"
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateItemPrice(item.id, e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving || items.length === 0}>
            {saving ? "Сохранение..." : "Сохранить накладную"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products/invoices")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}

