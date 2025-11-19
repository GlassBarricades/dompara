import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const items = Array.isArray(body.items) ? body.items : [];
    const { customer } = body as {
      customer?: {
        name?: string;
        phone?: string;
        email?: string;
        telegram?: string;
        comment?: string;
      };
    };

    if (!items.length) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      );
    }

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json(
        { error: "Имя и телефон обязательны" },
        { status: 400 }
      );
    }

    // считаем итоговую сумму на сервере
    const total = items.reduce(
      (acc: number, item: any) =>
        acc + Number(item.price ?? 0) * Number(item.quantity ?? 0),
      0
    );

    // создаём запись в orders (если Supabase настроен)
    let orderId: string | null = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          telegram: customer.telegram || null,
          comment: customer.comment || null,
          items,
          status: "new",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to create order in Supabase", error);
      } else {
        orderId = (data as { id: string }).id;
      }
    }

    // Отправляем в Telegram (если настроено)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const lines: string[] = [];
        lines.push("🧺 Новая заявка из корзины");
        if (orderId) {
          lines.push(`ID заказа: ${orderId}`);
        }
        lines.push("");
        lines.push("Товары:");
        for (const item of items) {
          lines.push(
            `• ${item.name} — ${item.price} BYN × ${item.quantity} = ${
              Number(item.price ?? 0) * Number(item.quantity ?? 0)
            } BYN`
          );
        }
        lines.push("");
        lines.push(`Итого: ${total} BYN`);
        lines.push("");
        lines.push("Клиент:");
        lines.push(`Имя: ${customer.name}`);
        lines.push(`Телефон: ${customer.phone}`);
        if (customer.email) lines.push(`Email: ${customer.email}`);
        if (customer.telegram) lines.push(`Telegram: ${customer.telegram}`);
        if (customer.comment) {
          lines.push("");
          lines.push("Комментарий:");
          lines.push(customer.comment);
        }

        const text = lines.join("\n");

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text,
            }),
          }
        );

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json().catch(() => ({}));
          console.error("Failed to send message to Telegram:", errorData);
        }
      } catch (telegramError) {
        // Логируем ошибку, но не прерываем выполнение
        // Заявка уже сохранена в БД, поэтому продолжаем
        console.error("Error sending message to Telegram:", telegramError);
      }
    }

    return NextResponse.json({ success: true, orderId, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось оформить заявку" },
      { status: 500 }
    );
  }
}


