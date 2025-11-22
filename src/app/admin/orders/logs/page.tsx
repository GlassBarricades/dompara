'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface OrderLog {
  id: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
}

export default function OrderLogsPage() {
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [orders, setOrders] = useState<Array<{ id: string; customer_name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOrderId, setFilterOrderId] = useState<string>("");
  const [filterFieldName, setFilterFieldName] = useState<string>("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadOrders();
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, filterOrderId, filterFieldName, page]);

  async function loadOrders() {
    if (!canUseSupabase) return;

    try {
      const { data } = await supabase!
        .from("orders")
        .select("id, customer_name")
        .order("created_at", { ascending: false })
        .limit(1000);

      setOrders((data ?? []) as Array<{ id: string; customer_name: string }>);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  }

  async function loadLogs() {
    if (!canUseSupabase) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase!
        .from("order_logs")
        .select("id, order_id, field_name, old_value, new_value, comment, created_at")
        .order("created_at", { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (filterOrderId) {
        query = query.eq("order_id", filterOrderId);
      }

      if (filterFieldName) {
        query = query.eq("field_name", filterFieldName);
      }

      const { data: logsData, error } = await query;

      if (error) throw error;

      // Загружаем информацию о заявках
      const orderIds = [...new Set((logsData ?? []).map((l: any) => l.order_id))];
      let ordersMap = new Map<string, string>();

      if (orderIds.length > 0) {
        const { data: ordersData } = await supabase!
          .from("orders")
          .select("id, customer_name")
          .in("id", orderIds);

        if (ordersData) {
          ordersMap = new Map(
            ordersData.map((o: any) => [o.id, o.customer_name])
          );
        }
      }

      const logsWithOrders = (logsData ?? []).map((log: any) => ({
        id: log.id,
        order_id: log.order_id,
        order_number: log.order_id.substring(0, 8),
        customer_name: ordersMap.get(log.order_id) || "Неизвестный клиент",
        field_name: log.field_name,
        old_value: log.old_value,
        new_value: log.new_value,
        comment: log.comment,
        created_at: log.created_at,
      })) as OrderLog[];

      setLogs(logsWithOrders);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить логи заявок");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function formatValue(value: string | null): string {
    if (!value) return "—";
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
      return String(parsed);
    } catch {
      return value;
    }
  }

  function getFieldLabel(fieldName: string | null): string {
    if (!fieldName) return "Общее изменение";
    const labels: Record<string, string> = {
      status: "Статус",
      customer_name: "Имя клиента",
      phone: "Телефон",
      email: "Email",
      items: "Товары",
      comment: "Комментарий",
    };
    return labels[fieldName] || fieldName;
  }

  const filteredLogs = useMemo(() => {
    return logs;
  }, [logs]);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Логи заявок</h1>
          <p className="text-sm text-muted-foreground">
            История всех изменений заявок для контроля операций.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Назад к заявкам</Link>
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
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={filterOrderId}
            onChange={(e) => {
              setFilterOrderId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все заявки</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.customer_name} (#{o.id.substring(0, 8)})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={filterFieldName}
            onChange={(e) => {
              setFilterFieldName(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все поля</option>
            <option value="status">Статус</option>
            <option value="customer_name">Имя клиента</option>
            <option value="phone">Телефон</option>
            <option value="email">Email</option>
            <option value="items">Товары</option>
            <option value="comment">Комментарий</option>
          </select>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            История изменений ({filteredLogs.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Дата и время</th>
              <th className="px-3 py-2">Заявка</th>
              <th className="px-3 py-2">Поле</th>
              <th className="px-3 py-2">Было</th>
              <th className="px-3 py-2">Стало</th>
              <th className="px-3 py-2">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Логи не найдены.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <div className="font-medium">{log.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        #{log.order_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
                      {getFieldLabel(log.field_name)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs">
                    <pre className="whitespace-pre-wrap break-words text-[11px]">
                      {formatValue(log.old_value)}
                    </pre>
                  </td>
                  <td className="px-3 py-3 text-xs max-w-xs">
                    <pre className="whitespace-pre-wrap break-words text-[11px]">
                      {formatValue(log.new_value)}
                    </pre>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {log.comment || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Страница {page}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={filteredLogs.length < itemsPerPage || loading}
          >
            Вперед
          </Button>
        </div>
      </div>
    </section>
  );
}

