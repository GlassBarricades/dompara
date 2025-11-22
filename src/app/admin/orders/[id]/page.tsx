"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type OrderStatus = "new" | "in_progress" | "completed" | "rejected";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  comment: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  status: OrderStatus;
  created_at: string;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  price: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Проведена",
  rejected: "Отклонена",
};

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<OrderStatus>("new");
  const [items, setItems] = useState<Order["items"]>([]);

  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !orderId) return;
    void loadOrder();
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, orderId]);

  async function loadOrder() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      if (!data) {
        setError("Заявка не найдена");
        setLoading(false);
        return;
      }

      const orderData = data as Order;
      setOrder(orderData);
      setCustomerName(orderData.customer_name);
      setPhone(orderData.phone);
      setEmail(orderData.email || "");
      setTelegram(orderData.telegram || "");
      setComment(orderData.comment || "");
      setStatus(orderData.status);
      setItems(Array.isArray(orderData.items) ? orderData.items : []);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить заявку");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    if (!canUseSupabase) return;

    try {
      const { data, error } = await supabase!
        .from("products")
        .select("id, name, slug, price")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts((data ?? []) as ProductOption[]);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  async function logOrderChange(
    fieldName: string | null,
    oldValue: any,
    newValue: any,
    comment?: string
  ) {
    if (!canUseSupabase || !orderId) return;

    try {
      await supabase!.from("order_logs").insert({
        order_id: orderId,
        field_name: fieldName,
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
        comment: comment || null,
      });
    } catch (err) {
      console.error("Failed to log order change:", err);
    }
  }

  async function handleSave() {
    if (!canUseSupabase || !order) return;

    if (!customerName.trim() || !phone.trim()) {
      setError("Заполните имя и телефон");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const oldOrder = { ...order };
      const newOrderData = {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        telegram: telegram.trim() || null,
        comment: comment.trim() || null,
        items,
        status,
      };

      // Если заявка уже была проведена и мы меняем товары или статус
      if (
        oldOrder.status === "completed" &&
        (status !== "completed" ||
          JSON.stringify(oldOrder.items) !== JSON.stringify(items))
      ) {
        if (
          !window.confirm(
            "Внимание! Заявка уже была проведена. Изменение товаров или статуса может привести к расхождениям в остатках. Продолжить?"
          )
        ) {
          setSaving(false);
          return;
        }
      }

      // Если переводим в "проведена", нужно списать остатки
      if (status === "completed" && oldOrder.status !== "completed") {
        if (
          !window.confirm(
            "Провести заявку? Это списает товары со склада. Продолжить?"
          )
        ) {
          setSaving(false);
          return;
        }

        // Списываем остатки
        try {
          for (const item of items) {
            // item.id может быть либо UUID товара, либо slug
            // Пробуем сначала найти по UUID, потом по slug
            let product = null;

            // Пробуем найти по UUID (основной вариант)
            const { data: productById } = await supabase!
              .from("products")
              .select("id, stock_quantity, is_custom_order")
              .eq("id", item.id)
              .maybeSingle();

            if (productById) {
              product = productById;
            } else {
              // Если не нашли по UUID, пробуем по slug
              const { data: productBySlug } = await supabase!
                .from("products")
                .select("id, stock_quantity, is_custom_order")
                .eq("slug", item.id)
                .maybeSingle();

              if (productBySlug) {
                product = productBySlug;
              }
            }

            if (!product || product.is_custom_order) {
              console.warn(
                `Товар не найден или под заказ: ${item.id} (${item.name})`
              );
              continue;
            }

            const oldStock = product.stock_quantity ?? 0;
            const quantity = Number(item.quantity) || 0;

            if (quantity <= 0) {
              console.warn(
                `Неверное количество для товара: ${item.id} (${item.name})`
              );
              continue;
            }

            const newStock = Math.max(0, oldStock - quantity);

            // Обновляем остаток
            const { error: updateError } = await supabase!
              .from("products")
              .update({ stock_quantity: newStock })
              .eq("id", product.id);

            if (updateError) {
              console.error(
                `Ошибка обновления остатка для товара ${product.id}:`,
                updateError
              );
              throw updateError;
            }

            // Логируем списание
            await supabase!.from("stock_movements").insert({
              product_id: product.id,
              old_quantity: oldStock,
              new_quantity: newStock,
              movement_type: "outcome",
              comment: `Списание по заявке #${orderId.substring(0, 8)}`,
            });
          }
        } catch (err) {
          console.error("Failed to process stock deduction:", err);
          setError(
            `Не удалось списать остатки: ${
              err instanceof Error ? err.message : "Неизвестная ошибка"
            }. Проверьте логи в консоли.`
          );
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase!
        .from("orders")
        .update(newOrderData)
        .eq("id", orderId);

      if (error) throw error;

      // Логируем изменения
      if (oldOrder.customer_name !== newOrderData.customer_name) {
        await logOrderChange(
          "customer_name",
          oldOrder.customer_name,
          newOrderData.customer_name
        );
      }
      if (oldOrder.phone !== newOrderData.phone) {
        await logOrderChange("phone", oldOrder.phone, newOrderData.phone);
      }
      if (oldOrder.email !== newOrderData.email) {
        await logOrderChange("email", oldOrder.email, newOrderData.email);
      }
      if (oldOrder.status !== newOrderData.status) {
        await logOrderChange(
          "status",
          oldOrder.status,
          newOrderData.status,
          `Статус изменен с "${STATUS_LABELS[oldOrder.status]}" на "${
            STATUS_LABELS[newOrderData.status]
          }"`
        );
      }
      if (
        JSON.stringify(oldOrder.items) !== JSON.stringify(newOrderData.items)
      ) {
        await logOrderChange("items", oldOrder.items, newOrderData.items);
      }

      router.push("/admin/orders");
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить заявку");
    } finally {
      setSaving(false);
    }
  }

  function handleAddItem() {
    if (!newItemProductId || !newItemQuantity) {
      setError("Выберите товар и укажите количество");
      return;
    }

    const product = products.find((p) => p.slug === newItemProductId);
    if (!product) {
      setError("Товар не найден");
      return;
    }

    const quantity = Number(newItemQuantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть положительным числом");
      return;
    }

    setItems([
      ...items,
      {
        id: product.slug,
        name: product.name,
        price: product.price,
        quantity,
      },
    ]);

    setNewItemProductId("");
    setNewItemQuantity("");
    setEditItemDialogOpen(false);
    setError(null);
  }

  function handleEditItem(index: number) {
    const item = items[index];
    setEditingItemIndex(index);
    setNewItemProductId(item.id);
    setNewItemQuantity(String(item.quantity));
    setEditItemDialogOpen(true);
  }

  function handleUpdateItem() {
    if (editingItemIndex === null || !newItemProductId || !newItemQuantity) {
      setError("Заполните все поля");
      return;
    }

    const product = products.find((p) => p.slug === newItemProductId);
    if (!product) {
      setError("Товар не найден");
      return;
    }

    const quantity = Number(newItemQuantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть положительным числом");
      return;
    }

    const newItems = [...items];
    newItems[editingItemIndex] = {
      id: product.slug,
      name: product.name,
      price: product.price,
      quantity,
    };

    setItems(newItems);
    setEditItemDialogOpen(false);
    setEditingItemIndex(null);
    setNewItemProductId("");
    setNewItemQuantity("");
    setError(null);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </section>
    );
  }

  if (error && !order) {
    return (
      <section className="space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Назад к заявкам</Link>
        </Button>
      </section>
    );
  }

  if (!order) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование заявки</h1>
          <p className="text-sm text-muted-foreground">
            Измените данные заявки и товары.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Назад к заявкам</Link>
        </Button>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {order.status === "completed" && (
        <div className="rounded-md border-2 border-emerald-600 bg-emerald-100 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100">
          <strong className="font-semibold">Внимание:</strong> Заявка уже
          проведена. Товары списаны со склада. Изменение товаров или статуса
          может привести к расхождениям в остатках.
        </div>
      )}

      <div className="space-y-6">
        {/* Информация о клиенте */}
        <div className="rounded-md border bg-background p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">Информация о клиенте</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Telegram</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Комментарий</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Статус</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Проведена</option>
              <option value="rejected">Отклонена</option>
            </select>
          </div>
        </div>

        {/* Товары */}
        <div className="rounded-md border bg-background p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Товары</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingItemIndex(null);
                setNewItemProductId("");
                setNewItemQuantity("");
                setEditItemDialogOpen(true);
              }}
            >
              Добавить товар
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Товары не добавлены</p>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Товар</th>
                    <th className="px-3 py-2 text-right">Цена</th>
                    <th className="px-3 py-2 text-right">Количество</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                    <th className="px-3 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-3 font-medium">{item.name}</td>
                      <td className="px-3 py-3 text-right">{item.price} BYN</td>
                      <td className="px-3 py-3 text-right">{item.quantity}</td>
                      <td className="px-3 py-3 text-right font-medium">
                        {item.price * item.quantity} BYN
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(index)}
                          >
                            Изменить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30">
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-right font-semibold"
                    >
                      Итого:
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {totalAmount} BYN
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </div>

      {/* Диалог добавления/редактирования товара */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItemIndex !== null ? "Изменить товар" : "Добавить товар"}
            </DialogTitle>
            <DialogDescription>
              Выберите товар и укажите количество
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Товар</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={newItemProductId}
                onChange={(e) => setNewItemProductId(e.target.value)}
              >
                <option value="">Выберите товар</option>
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} — {p.price} BYN
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Количество</label>
              <input
                type="number"
                step="1"
                min="1"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditItemDialogOpen(false);
                setEditingItemIndex(null);
                setNewItemProductId("");
                setNewItemQuantity("");
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={
                editingItemIndex !== null ? handleUpdateItem : handleAddItem
              }
            >
              {editingItemIndex !== null ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
