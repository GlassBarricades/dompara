'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface BannerFormState {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url: string;
  button_text: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: BannerFormState = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  link_url: "",
  button_text: "",
  sort_order: 0,
  is_active: true,
};

export default function NewBannerPage() {
  const router = useRouter();
  const [form, setForm] = useState<BannerFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  function handleChange<K extends keyof BannerFormState>(
    key: K,
    value: BannerFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("homepage_banners").insert({
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        button_text: form.button_text || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });

      if (error) throw error;
      router.push("/admin/banners");
    } catch (err) {
      console.error(err);
      setError("Не удалось создать баннер");
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Новый баннер</h1>
          <p className="text-sm text-muted-foreground">
            Добавьте слайд для первого экрана главной страницы.
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

      <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Заголовок</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Подзаголовок</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="Краткое пояснение, отображается крупным текстом"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Описание (опционально)</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Будет показано только на десктопе под подзаголовком"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">URL изображения</label>
          <input
            type="url"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.image_url}
            onChange={(e) => handleChange("image_url", e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Ссылка на горизонтальное изображение (рекомендуется 1600×600 и
            больше, формат JPG/WEBP).
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Ссылка кнопки</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.link_url}
            onChange={(e) => handleChange("link_url", e.target.value)}
            placeholder="/catalog/pechi"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Текст кнопки</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.button_text}
            onChange={(e) => handleChange("button_text", e.target.value)}
            placeholder="Например: Перейти к разделу"
          />
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
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={form.is_active}
            onChange={(e) => handleChange("is_active", e.target.checked)}
          />
          <label htmlFor="is_active" className="text-sm">
            Показывать баннер в слайдере
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving || !canUseSupabase}>
            {saving ? "Сохранение..." : "Создать"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/banners")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}


