'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  invoice_number: string;
  supplier_name: string | null;
  invoice_date: string;
  comment: string | null;
  created_at: string;
  items_count: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadInvoices() {
    setLoading(true);
    setError(null);

    try {
      // Загружаем накладные
      const { data: invoicesData, error: invoicesError } = await supabase!
        .from("invoices")
        .select("id, invoice_number, supplier_name, invoice_date, comment, created_at")
        .order("invoice_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Загружаем количество позиций для каждой накладной
      const invoicesWithCounts = await Promise.all(
        (invoicesData ?? []).map(async (invoice: any) => {
          const { count } = await supabase!
            .from("invoice_items")
            .select("*", { count: "exact", head: true })
            .eq("invoice_id", invoice.id);

          return {
            ...invoice,
            items_count: count ?? 0,
          };
        })
      );

      setInvoices(invoicesWithCounts as Invoice[]);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить накладные");
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
    }).format(date);
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Накладные</h1>
          <p className="text-sm text-muted-foreground">
            Управление накладными на приход товаров.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products">Назад к товарам</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/invoices/new">Новая накладная</Link>
          </Button>
        </div>
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

      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Список накладных ({invoices.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Номер накладной</th>
              <th className="px-3 py-2">Дата</th>
              <th className="px-3 py-2">Поставщик</th>
              <th className="px-3 py-2">Позиций</th>
              <th className="px-3 py-2">Комментарий</th>
              <th className="px-3 py-2 text-right">Действия</th>
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
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Накладные не найдены.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-3 py-3 font-medium">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {invoice.supplier_name || "—"}
                  </td>
                  <td className="px-3 py-3 text-sm">{invoice.items_count}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {invoice.comment || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/products/invoices/${invoice.id}`}>
                        Просмотр
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

