"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface PageContentFormState {
  page_key: string;
  title: string;
  content_html: string;
}

const emptyForm: PageContentFormState = {
  page_key: "",
  title: "",
  content_html: "",
};

export default function NewPageContentPage() {
  const router = useRouter();
  const [form, setForm] = useState<PageContentFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  function handleChange<K extends keyof PageContentFormState>(
    key: K,
    value: PageContentFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.page_key.trim() || !form.title.trim() || !form.content_html.trim()) {
      setError("Заполните все поля");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("page_content").insert({
        page_key: form.page_key.trim().toLowerCase(),
        title: form.title,
        content_html: form.content_html,
      });

      if (error) throw error;
      router.push("/admin/pages");
    } catch (err) {
      console.error(err);
      setError("Не удалось создать страницу");
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Новая страница</h1>
          <p className="text-sm text-muted-foreground">
            Создайте новую статическую страницу для сайта.
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

      <form className="max-w-4xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Ключ страницы</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.page_key}
            onChange={(e) => handleChange("page_key", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
            required
            placeholder="delivery, about, faq"
          />
          <p className="text-xs text-muted-foreground">
            Уникальный ключ для идентификации страницы (только латинские буквы, цифры, дефисы и подчеркивания)
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
            {saving ? "Сохранение..." : "Создать"}
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
