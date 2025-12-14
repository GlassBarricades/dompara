'use client';

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber, validatePhone } from "@/lib/phone-mask";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

function CartPageInner() {
  const cart = useCartStore();
  const hasItems = cart.itemsList.length > 0;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    phone?: boolean;
    email?: boolean;
  }>({});

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (field: "name" | "phone" | "email", value: string) => {
    const newErrors = { ...errors };

    if (field === "name") {
      if (!value.trim()) {
        newErrors.name = "Имя обязательно для заполнения";
      } else if (value.trim().length < 2) {
        newErrors.name = "Имя должно содержать минимум 2 символа";
      } else {
        delete newErrors.name;
      }
    }

    if (field === "phone") {
      if (!value.trim()) {
        newErrors.phone = "Телефон обязательно для заполнения";
      } else if (!validatePhone(value)) {
        newErrors.phone = "Введите корректный номер телефона (+375 XX XXX-XX-XX)";
      } else {
        delete newErrors.phone;
      }
    }

    if (field === "email" && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        newErrors.email = "Введите корректный email адрес";
      } else {
        delete newErrors.email;
      }
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const handleBlur = (field: "name" | "phone" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "name") validateField("name", name);
    if (field === "phone") validateField("phone", phone);
    if (field === "email") validateField("email", email);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasItems || submitting) return;

    // Валидация всех полей
    const nameValid = validateField("name", name);
    const phoneValid = validateField("phone", phone);
    const emailValid = !email.trim() || validateField("email", email);

    setTouched({ name: true, phone: true, email: true });

    if (!nameValid || !phoneValid || !emailValid) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

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
      setErrors({});
      setTouched({});
      toast.success("Заявка успешно отправлена!");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Не удалось отправить заявку");
      toast.error(err.message || "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (touched.phone) {
      validateField("phone", formatted);
    }
  };

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
                    {item.price.toLocaleString("ru-RU")} BYN × {item.quantity}
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
              Итого: {cart.totalPrice.toLocaleString("ru-RU")} BYN
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

            {submitError && (
              <p className="text-sm text-red-600">
                {submitError}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Имя <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) {
                      validateField("name", e.target.value);
                    }
                  }}
                  onBlur={() => handleBlur("name")}
                  error={touched.name ? errors.name : undefined}
                  placeholder="Ваше имя"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur("phone")}
                  error={touched.phone ? errors.phone : undefined}
                  placeholder="+375 (XX) XXX-XX-XX"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      validateField("email", e.target.value);
                    }
                  }}
                  onBlur={() => handleBlur("email")}
                  error={touched.email ? errors.email : undefined}
                  placeholder="email@example.com"
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



