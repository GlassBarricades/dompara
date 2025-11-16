'use client';

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";

function CartPageInner() {
  const cart = useCartStore();
  const hasItems = cart.itemsList.length > 0;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasItems || submitting) return;

    if (!name.trim() || !phone.trim()) {
      setError("Пожалуйста, заполните имя и телефон");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.itemsList.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customer: {
            name,
            phone,
            email: email || null,
            telegram: telegram || null,
            comment: comment || null,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось отправить заявку");
      }

      setSuccess(true);
      cart.clear();
      setName("");
      setPhone("");
      setEmail("");
      setTelegram("");
      setComment("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Корзина</h1>

      {!hasItems && !success && (
        <p className="text-muted-foreground">
          В корзине пока пусто. Добавьте товары из каталога.
        </p>
      )}

      {hasItems && !success && (
        <div className="space-y-6">
          <ul className="divide-y rounded-md border">
            {cart.itemsList.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.price.toLocaleString("ru-RU")} ₽ × {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => cart.setQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => cart.setQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => cart.removeItem(item.id)}
                  >
                    ✕
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Товаров: {cart.totalCount}
            </div>
            <div className="text-lg font-semibold">
              Итого: {cart.totalPrice.toLocaleString("ru-RU")} ₽
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-md border p-4"
          >
            <h2 className="text-lg font-semibold">Контактные данные</h2>
            <p className="text-sm text-muted-foreground">
              Оставьте свои контакты, и мы свяжемся с вами для уточнения деталей
              заказа.
            </p>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                placeholder="Например, желаемое время звонка или уточнения по доставке"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={!hasItems || submitting}>
                {submitting ? "Отправка..." : "Отправить заявку"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="rounded-md border bg-muted/40 p-6 space-y-2">
          <h2 className="text-lg font-semibold">Заявка отправлена</h2>
          <p className="text-sm text-muted-foreground">
            Спасибо! Мы получили ваш запрос и скоро свяжемся с вами для подтверждения
            заказа.
          </p>
        </div>
      )}
    </main>
  );
}

export default observer(CartPageInner);



