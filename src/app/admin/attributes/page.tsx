'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

type DataType = "string" | "number" | "boolean" | "select" | "multiselect";

interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  data_type: DataType;
  unit: string | null;
  options: any | null;
  description: string | null;
}

const emptyForm: Omit<AttributeDefinition, "id"> = {
  name: "",
  slug: "",
  data_type: "string",
  unit: "",
  options: null,
  description: "",
};

export default function AdminAttributesPage() {
  const [items, setItems] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [optionsText, setOptionsText] = useState("");

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadAttributes() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase!
      .from("attribute_definitions")
      .select("id, name, slug, data_type, unit, options, description")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setError("Не удалось загрузить характеристики");
    } else {
      setItems((data ?? []) as AttributeDefinition[]);
    }

    setLoading(false);
  }

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOptionsText("");
  }

  function startEdit(row: AttributeDefinition) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      data_type: row.data_type,
      unit: row.unit ?? "",
      options: row.options,
      description: row.description ?? "",
    });
    if (row.options && Array.isArray(row.options)) {
      setOptionsText(
        row.options
          .map((opt: any) =>
            typeof opt === "string" ? opt : opt.label ?? opt.value ?? ""
          )
          .join("\n")
      );
    } else {
      setOptionsText("");
    }
  }

  function buildOptionsFromText(): any | null {
    if (
      form.data_type !== "select" &&
      form.data_type !== "multiselect"
    ) {
      return null;
    }
    const lines = optionsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;
    return lines.map((line) => ({
      value: line.toLowerCase().replace(/\s+/g, "_"),
      label: line,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      data_type: form.data_type,
      unit: form.unit || null,
      options: buildOptionsFromText(),
      description: form.description || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase!
          .from("attribute_definitions")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase!
          .from("attribute_definitions")
          .insert(payload);
        if (error) throw error;
      }

      await loadAttributes();
      startCreate();
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить характеристику");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canUseSupabase) return;
    if (!window.confirm("Удалить характеристику? Связанные назначения будут также удалены.")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase!
        .from("attribute_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadAttributes();
      if (editingId === id) {
        startCreate();
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить характеристику");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Характеристики товаров</h1>
          <p className="text-sm text-muted-foreground">
            Справочник параметров, которые можно назначать категориям, подкатегориям и товарам.
          </p>
        </div>
        <Button variant="outline" onClick={startCreate}>
          Новая характеристика
        </Button>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-md border">
          <div className="border-b px-4 py-2 text-sm text-muted-foreground">
            Список характеристик
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Загрузка...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Характеристики ещё не созданы.
              </div>
            ) : (
              items.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {row.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({row.data_type}
                        {row.unit ? `, ${row.unit}` : ""})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      slug: {row.slug}
                    </div>
                    {row.data_type === "select" ||
                    row.data_type === "multiselect" ? (
                      <div className="text-xs text-muted-foreground">
                        Опции:{" "}
                        {row.options && Array.isArray(row.options)
                          ? row.options
                              .map((opt: any) => opt.label ?? opt.value ?? "")
                              .join(", ")
                          : "—"}
                      </div>
                    ) : null}
                    {row.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {row.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => startEdit(row)}
                    >
                      ✎
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(row.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId
              ? "Редактирование характеристики"
              : "Новая характеристика"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">Название</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Системное имя, например: <code>material</code>,{" "}
                <code>power</code>, <code>volume</code>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Тип данных</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.data_type}
                onChange={(e) =>
                  handleChange("data_type", e.target.value as DataType)
                }
              >
                <option value="string">Строка</option>
                <option value="number">Число</option>
                <option value="boolean">Да/нет</option>
                <option value="select">Выбор одного</option>
                <option value="multiselect">Выбор нескольких</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Единица измерения</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.unit ?? ""}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="кВт, л, мм..."
              />
            </div>

            {(form.data_type === "select" ||
              form.data_type === "multiselect") && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Опции (по строке)</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder={"Сталь\nЧугун\nНержавейка"}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Описание</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px]"
                value={form.description ?? ""}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving || !canUseSupabase}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={startCreate}
                  disabled={saving}
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}


