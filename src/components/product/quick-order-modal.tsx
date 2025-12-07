"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuickOrderModalProps {
  productName: string;
  productPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickOrderModal({
  productName,
  productPrice,
  isOpen,
  onClose,
  onSuccess,
}: QuickOrderModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

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
          items: [
            {
              id: "quick-order",
              name: productName,
              price: productPrice,
              quantity: 1,
            },
          ],
          customer: {
            name,
            phone,
            email: email || null,
            comment: comment || null,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось отправить заявку");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setName("");
        setPhone("");
        setEmail("");
        setComment("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 space-y-4 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Быстрый заказ</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 border-b pb-4">
          <div className="text-sm font-medium">{productName}</div>
          <div className="text-lg font-semibold">
            {productPrice.toLocaleString("ru-RU")} BYN
          </div>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-2xl">✓</div>
            <div className="font-medium">Заявка отправлена!</div>
            <div className="text-sm text-muted-foreground">
              Мы свяжемся с вами в ближайшее время
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

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
                autoFocus
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
              <label className="text-sm font-medium">Комментарий</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Дополнительная информация..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Отправка..." : "Оформить заказ"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
