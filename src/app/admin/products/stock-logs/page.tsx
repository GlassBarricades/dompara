'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  old_quantity: number | null;
  new_quantity: number | null;
  movement_type: 'income' | 'outcome' | 'set' | 'inventory';
  comment: string | null;
  created_at: string;
}

interface ProductOption {
  id: string;
  name: string;
}

export default function StockLogsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterMovementType, setFilterMovementType] = useState<string>("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadProducts();
    void loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, filterProductId, filterMovementType, page]);

  async function loadProducts() {
    if (!canUseSupabase) return;

    try {
      const { data, error } = await supabase!
        .from("products")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts((data ?? []) as ProductOption[]);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  async function loadMovements() {
    if (!canUseSupabase) return;

    setLoading(true);
    setError(null);

    try {
      // Сначала загружаем логи
      let query = supabase!
        .from("stock_movements")
        .select("id, product_id, old_quantity, new_quantity, movement_type, comment, created_at")
        .order("created_at", { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (filterProductId) {
        query = query.eq("product_id", filterProductId);
      }

      if (filterMovementType) {
        query = query.eq("movement_type", filterMovementType);
      }

      const { data: movementsData, error } = await query;

      if (error) throw error;

      // Получаем уникальные ID товаров
      const productIds = [
        ...new Set((movementsData ?? []).map((m: any) => m.product_id)),
      ];

      // Загружаем названия товаров
      let productsMap = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: productsData } = await supabase!
          .from("products")
          .select("id, name")
          .in("id", productIds);

        if (productsData) {
          productsMap = new Map(
            productsData.map((p: any) => [p.id, p.name])
          );
        }
      }

      const movements = (movementsData ?? []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: productsMap.get(item.product_id) || "Неизвестный товар",
        old_quantity: item.old_quantity,
        new_quantity: item.new_quantity,
        movement_type: item.movement_type,
        comment: item.comment,
        created_at: item.created_at,
      })) as StockMovement[];

      setMovements(movements);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить логи изменений остатков");
    } finally {
      setLoading(false);
    }
  }

  function getMovementTypeLabel(type: string) {
    switch (type) {
      case 'income':
        return 'Приход';
      case 'outcome':
        return 'Списание';
      case 'set':
        return 'Установка';
      case 'inventory':
        return 'Инвентаризация';
      default:
        return type;
    }
  }

  function getMovementTypeColor(type: string) {
    switch (type) {
      case 'income':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100 font-medium';
      case 'outcome':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100 font-medium';
      case 'set':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100 font-medium';
      case 'inventory':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-100 font-medium';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-medium';
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

  const filteredMovements = useMemo(() => {
    return movements;
  }, [movements]);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Логи изменений остатков</h1>
          <p className="text-sm text-muted-foreground">
            История всех изменений остатков товаров на складе.
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
          {error}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={filterProductId}
            onChange={(e) => {
              setFilterProductId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все товары</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={filterMovementType}
            onChange={(e) => {
              setFilterMovementType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все операции</option>
            <option value="income">Приход</option>
            <option value="outcome">Списание</option>
            <option value="set">Установка</option>
            <option value="inventory">Инвентаризация</option>
          </select>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            История изменений ({filteredMovements.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Дата и время</th>
              <th className="px-3 py-2">Товар</th>
              <th className="px-3 py-2">Тип операции</th>
              <th className="px-3 py-2">Было</th>
              <th className="px-3 py-2">Стало</th>
              <th className="px-3 py-2">Изменение</th>
              <th className="px-3 py-2">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Загрузка...
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Логи не найдены.
                </td>
              </tr>
            ) : (
              filteredMovements.map((movement) => {
                const change = (movement.new_quantity ?? 0) - (movement.old_quantity ?? 0);
                return (
                  <tr key={movement.id} className="border-t">
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{movement.product_name}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getMovementTypeColor(
                          movement.movement_type
                        )}`}
                      >
                        {getMovementTypeLabel(movement.movement_type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {movement.old_quantity !== null &&
                      movement.old_quantity !== undefined
                        ? movement.old_quantity
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {movement.new_quantity !== null &&
                      movement.new_quantity !== undefined
                        ? movement.new_quantity
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {change !== 0 && (
                        <span
                          className={
                            change > 0
                              ? "text-emerald-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {change > 0 ? "+" : ""}
                          {change}
                        </span>
                      )}
                      {change === 0 && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {movement.comment || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Страница {page}
        </div>
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
            disabled={filteredMovements.length < itemsPerPage || loading}
          >
            Вперед
          </Button>
        </div>
      </div>
    </section>
  );
}

