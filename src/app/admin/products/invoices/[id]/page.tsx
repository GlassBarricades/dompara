'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
}

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number | null;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !invoiceId) return;
    void loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase, invoiceId]);

  async function loadInvoice() {
    setLoading(true);
    setError(null);

    try {
      // Загружаем накладную
      const { data: invoiceData, error: invoiceError } = await supabase!
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoiceData) {
        setError("Накладная не найдена");
        setLoading(false);
        return;
      }

      setInvoice(invoiceData as Invoice);

      // Загружаем позиции накладной
      const { data: itemsData, error: itemsError } = await supabase!
        .from("invoice_items")
        .select("id, product_id, quantity, price")
        .eq("invoice_id", invoiceId);

      if (itemsError) throw itemsError;

      // Загружаем названия товаров
      const productIds = (itemsData ?? []).map((item: any) => item.product_id);
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

      const invoiceItems = (itemsData ?? []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: productsMap.get(item.product_id) || "Неизвестный товар",
        quantity: item.quantity,
        price: item.price,
      })) as InvoiceItem[];

      setItems(invoiceItems);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить накладную");
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

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </section>
    );
  }

  if (error || !invoice) {
    return (
      <section className="space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error || "Накладная не найдена"}
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products/invoices">Назад к накладным</Link>
        </Button>
      </section>
    );
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.price ? item.price * item.quantity : 0);
  }, 0);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Накладная {invoice.invoice_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Детальная информация о накладной
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products/invoices">Назад к накладным</Link>
        </Button>
      </header>

      {/* Информация о накладной */}
      <div className="rounded-md border bg-background p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Информация о накладной</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Номер накладной</div>
            <div className="font-medium">{invoice.invoice_number}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Дата накладной</div>
            <div className="font-medium">{formatDate(invoice.invoice_date)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Поставщик</div>
            <div className="font-medium">
              {invoice.supplier_name || "—"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Создано</div>
            <div className="font-medium text-sm">
              {formatDateTime(invoice.created_at)}
            </div>
          </div>
        </div>

        {invoice.comment && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Комментарий</div>
            <div className="text-sm">{invoice.comment}</div>
          </div>
        )}
      </div>

      {/* Позиции накладной */}
      <div className="rounded-md border overflow-x-auto">
        <div className="border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Позиции накладной ({items.length})
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Товар</th>
              <th className="px-3 py-2 text-right">Количество</th>
              <th className="px-3 py-2 text-right">Цена за единицу</th>
              <th className="px-3 py-2 text-right">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Позиции не найдены.
                </td>
              </tr>
            ) : (
              <>
                {items.map((item) => {
                  const itemTotal = item.price ? item.price * item.quantity : null;
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-3 font-medium">{item.product_name}</td>
                      <td className="px-3 py-3 text-right">{item.quantity}</td>
                      <td className="px-3 py-3 text-right">
                        {item.price !== null
                          ? `${item.price.toFixed(2)} BYN`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {itemTotal !== null
                          ? `${itemTotal.toFixed(2)} BYN`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {totalAmount > 0 && (
                  <tr className="border-t bg-muted/30">
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-right font-semibold"
                    >
                      Итого:
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {totalAmount.toFixed(2)} BYN
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

