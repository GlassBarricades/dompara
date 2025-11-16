'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

type OrderStatus = "new" | "in_progress" | "done";

interface OrderRow {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  comment: string | null;
  items: any;
  status: OrderStatus;
  created_at: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Завершена",
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadOrders() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase!
      .from("orders")
      .select(
        "id, customer_name, phone, email, telegram, comment, items, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Не удалось загрузить заявки");
    } else {
      setItems((data ?? []) as OrderRow[]);
    }

    setLoading(false);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    if (!canUseSupabase) return;
    setSavingId(id);
    setError(null);
    try {
      const { error } = await supabase!
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить статус заявки");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Заявки</h1>
        <p className="text-sm text-muted-foreground">
          Список заявок из корзины, статусы и детали заказов.
        </p>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border">
        <div className="grid grid-cols-[1.2fr,1.2fr,auto] gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Клиент</span>
          <span>Товары</span>
          <span className="text-right">Статус</span>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Пока нет ни одной заявки.
            </div>
          ) : (
            items.map((order) => (
              <div key={order.id} className="grid gap-4 px-4 py-3 md:grid-cols-[1.2fr,1.2fr,auto]">
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
                    Дата: {new Date(order.created_at).toLocaleString("ru-RU")}
                  </div>
                  {order.comment && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Комментарий: {order.comment}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  {Array.isArray(order.items) &&
                    order.items.map((item: any, index: number) => (
                      <div key={index}>
                        {item.name} — {item.price} ₽ × {item.quantity}
                      </div>
                    ))}
                </div>

                <div className="flex flex-col items-end gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={savingId === order.id}
                      onClick={() => updateStatus(order.id, "new")}
                    >
                      N
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={savingId === order.id}
                      onClick={() => updateStatus(order.id, "in_progress")}
                    >
                      W
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={savingId === order.id}
                      onClick={() => updateStatus(order.id, "done")}
                    >
                      ✓
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

