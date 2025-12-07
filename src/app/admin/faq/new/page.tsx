"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface FAQFormState {
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FAQFormState = {
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
};

export default function NewFAQPage() {
  const router = useRouter();
  const [form, setForm] = useState<FAQFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  function handleChange<K extends keyof FAQFormState>(
    key: K,
    value: FAQFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.question.trim() || !form.answer.trim()) {
      setError("Заполните вопрос и ответ");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("faq_items").insert({
        question: form.question,
        answer: form.answer,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });

      if (error) throw error;
      router.push("/admin/faq");
    } catch (err) {
      console.error(err);
      setError("Не удалось создать вопрос");
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Новый вопрос</h1>
          <p className="text-sm text-muted-foreground">
            Добавьте часто задаваемый вопрос для главной страницы.
          </p>
        </div>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form className="max-w-2xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Вопрос</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.question}
            onChange={(e) => handleChange("question", e.target.value)}
            required
            placeholder="Как оформить заказ?"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Ответ</label>
          <RichTextEditor
            value={form.answer}
            onChange={(html) => handleChange("answer", html)}
            placeholder="Введите ответ на вопрос..."
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Используйте инструменты форматирования для оформления ответа
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Порядок сортировки</label>
          <input
            type="number"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.sort_order}
            onChange={(e) =>
              handleChange("sort_order", Number(e.target.value) || 0)
            }
          />
          <p className="text-xs text-muted-foreground">
            Вопросы сортируются по возрастанию этого значения.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
            />
            <label htmlFor="is_active" className="text-sm">
              Активно (показывать на главной странице)
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving || !canUseSupabase}>
            {saving ? "Сохранение..." : "Создать"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/faq")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}
