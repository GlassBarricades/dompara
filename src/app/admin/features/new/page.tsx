"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface FeatureFormState {
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FeatureFormState = {
  icon: "💳",
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export default function NewFeaturePage() {
  const router = useRouter();
  const [form, setForm] = useState<FeatureFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  function handleChange<K extends keyof FeatureFormState>(
    key: K,
    value: FeatureFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    if (!form.title.trim() || !form.description.trim()) {
      setError("Заполните название и описание");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!.from("features").insert({
        icon: form.icon || "💳",
        title: form.title,
        description: form.description,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });

      if (error) throw error;
      router.push("/admin/features");
    } catch (err) {
      console.error(err);
      setError("Не удалось создать преимущество");
      setSaving(false);
    }
  }

  const iconSuggestions = [
    "💳", "💬", "🎯", "🚚", "🛠️", "✅", "⭐", "🔥", "🏆", "💎",
    "🎁", "⚡", "🌟", "🔒", "📦", "🎨", "💡", "🌿", "🏡", "✨"
  ];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Новое преимущество</h1>
          <p className="text-sm text-muted-foreground">
            Добавьте преимущество для блока "Почему выбирают нас".
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
          <label className="text-sm font-medium">Иконка (эмодзи)</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.icon}
            onChange={(e) => handleChange("icon", e.target.value)}
            required
            maxLength={2}
            placeholder="💳"
          />
          <p className="text-xs text-muted-foreground">
            Выберите эмодзи для отображения преимущества
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {iconSuggestions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleChange("icon", icon)}
                className={`text-2xl px-2 py-1 rounded border transition-colors ${
                  form.icon === icon
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Название</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            placeholder="Заявка без предоплаты"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Описание</label>
          <textarea
            className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
            placeholder="Вы оформляете корзину как заявку, менеджер связывается, уточняет детали и только потом согласует оплату."
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
          <p className="text-xs text-muted-foreground">
            Преимущества сортируются по возрастанию этого значения.
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
            onClick={() => router.push("/admin/features")}
            disabled={saving}
          >
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}
