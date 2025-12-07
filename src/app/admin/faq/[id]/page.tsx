"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface FAQFormState {
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<FAQFormState>({
    question: "",
    answer: "",
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !id) return;
    void loadFAQ();
  }, [canUseSupabase, id]);

  async function loadFAQ() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("faq_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError("Вопрос не найден");
        setLoading(false);
        return;
      }

      setForm({
        question: data.question || "",
        answer: data.answer || "",
        sort_order: data.sort_order || 0,
        is_active: data.is_active !== false,
      });
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить вопрос");
    } finally {
      setLoading(false);
    }
  }

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
      const { error } = await supabase!
        .from("faq_items")
        .update({
          question: form.question,
          answer: form.answer,
          sort_order: form.sort_order,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/admin/faq");
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить вопрос");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить вопрос?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("faq_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      router.push("/admin/faq");
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить вопрос");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование вопроса</h1>
          <p className="text-sm text-muted-foreground">
            Измените данные вопроса.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/faq")}
        >
          Назад к списку
        </Button>
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
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={saving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Удалить
          </Button>
        </div>
      </form>
    </section>
  );
}
