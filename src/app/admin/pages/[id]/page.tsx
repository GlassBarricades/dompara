"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface PageContentFormState {
  page_key: string;
  title: string;
  content_html: string;
}

export default function EditPageContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<PageContentFormState>({
    page_key: "",
    title: "",
    content_html: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase || !id) return;
    void loadPageContent();
  }, [canUseSupabase, id]);

  async function loadPageContent() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase!
        .from("page_content")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError("Страница не найдена");
        setLoading(false);
        return;
      }

      setForm({
        page_key: data.page_key || "",
        title: data.title || "",
        content_html: data.content_html || "",
      });
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить страницу");
    } finally {
      setLoading(false);
    }
  }

  function handleChange<K extends keyof PageContentFormState>(
    key: K,
    value: PageContentFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.title.trim() || !form.content_html.trim()) {
      setError("Заполните заголовок и контент");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("page_content")
        .update({
          title: form.title,
          content_html: form.content_html,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/admin/pages");
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить страницу");
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
          <h1 className="text-2xl font-semibold">Редактирование страницы</h1>
          <p className="text-sm text-muted-foreground">
            Измените контент страницы.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/pages")}
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

      <form className="max-w-4xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Ключ страницы</label>
          <input
            type="text"
            className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            value={form.page_key}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Ключ страницы нельзя изменить после создания
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Заголовок страницы</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            placeholder="Доставка и оплата"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Контент страницы</label>
          <RichTextEditor
            value={form.content_html}
            onChange={(html) => handleChange("content_html", html)}
            placeholder="Введите контент страницы..."
            className="min-h-[400px]"
          />
          <p className="text-xs text-muted-foreground">
            Используйте инструменты форматирования для оформления текста
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving || !canUseSupabase}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/pages")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}
