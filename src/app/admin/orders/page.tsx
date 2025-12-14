"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/types";

type OrderRow = Order;

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Проведена",
  rejected: "Отклонена",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100",
  in_progress:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("orders")
        .select(
          "id, customer_name, phone, email, telegram, comment, items, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data ?? []) as OrderRow[]);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }

  async function logOrderChange(
    orderId: string,
    fieldName: string | null,
    oldValue: any,
    newValue: any,
    comment?: string
  ) {
    if (!canUseSupabase) return;

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

  async function updateStatus(id: string, newStatus: OrderStatus) {
    if (!canUseSupabase) return;

    const order = items.find((o) => o.id === id);
    if (!order) return;

    // Если переводим в "проведена", нужно списать остатки
    if (newStatus === "completed" && order.status !== "completed") {
      if (
        !window.confirm(
          "Провести заявку? Это списает товары со склада. Продолжить?"
        )
      ) {
        return;
      }

      // Списываем остатки
      try {
        for (const item of Array.isArray(order.items) ? order.items : []) {
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
            comment: `Списание по заявке #${order.id.substring(0, 8)}`,
          });
        }
      } catch (err) {
        console.error("Failed to process stock deduction:", err);
        setError(
          `Не удалось списать остатки: ${
            err instanceof Error ? err.message : "Неизвестная ошибка"
          }. Проверьте логи в консоли.`
        );
        setSavingId(null);
        return;
      }
    }

    setSavingId(id);
    setError(null);

    try {
      const oldStatus = order.status;
      const { error } = await supabase!
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Логируем изменение статуса
      await logOrderChange(
        id,
        "status",
        oldStatus,
        newStatus,
        `Статус изменен с "${STATUS_LABELS[oldStatus]}" на "${STATUS_LABELS[newStatus]}"`
      );

      await loadOrders();
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить статус заявки");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить заявку? Это действие нельзя отменить."))
      return;

    setSavingId(id);
    setError(null);
    try {
      const { error } = await supabase!.from("orders").delete().eq("id", id);
      if (error) throw error;
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить заявку");
    } finally {
      setSavingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (filterStatus) {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.customer_name.toLowerCase().includes(query) ||
          item.phone.includes(query) ||
          (item.email && item.email.toLowerCase().includes(query)) ||
          (item.telegram && item.telegram.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, filterStatus, searchQuery]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Заявки</h1>
          <p className="text-sm text-muted-foreground">
            Управление заявками, статусы и детали заказов.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders/logs">Логи заявок</Link>
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

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Поиск по имени, телефону, email, telegram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="new">Новая</option>
            <option value="in_progress">В работе</option>
            <option value="completed">Проведена</option>
            <option value="rejected">Отклонена</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Список заявок ({filteredItems.length})
          </span>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Заявки не найдены.
            </div>
          ) : (
            filteredItems.map((order) => (
              <div
                key={order.id}
                className="grid gap-4 px-4 py-3 md:grid-cols-[1.2fr,1.2fr,auto] hover:bg-muted/30"
              >
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Телефон: {order.phone}
                  </div>
                  {order.email && (
                    <div className="text-xs text-muted-foreground">
                      Email: {order.email}
                    </div>
                  )}
                  {order.telegram && (
                    <div className="text-xs text-muted-foreground">
                      Telegram: {order.telegram}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </div>
                  {order.comment && (
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {order.comment}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  {Array.isArray(order.items) &&
                    order.items.map((item: any, index: number) => (
                      <div key={index}>
                        {item.name} — {item.price} BYN × {item.quantity}
                      </div>
                    ))}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs font-medium">
                      Итого:{" "}
                      {order.items.reduce(
                        (sum: number, item: any) =>
                          sum + (item.price || 0) * (item.quantity || 0),
                        0
                      )}{" "}
                      BYN
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[order.status]
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      disabled={savingId === order.id}
                    >
                      <Link href={`/admin/orders/${order.id}`}>
                        Редактировать
                      </Link>
                    </Button>
                    {order.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === order.id}
                        onClick={() => updateStatus(order.id, "completed")}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        Провести
                      </Button>
                    )}
                    {order.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === order.id}
                        onClick={() => updateStatus(order.id, "rejected")}
                        className="text-red-600 hover:text-red-700"
                      >
                        Отклонить
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savingId === order.id}
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
