'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

interface ContactSettingsForm {
  id?: string;
  phone: string;
  email: string;
  telegram: string;
  address: string;
  showroom_hours: string;
  company_name: string;
  requisites: string;
  logo_url: string;
}

const emptyForm: ContactSettingsForm = {
  phone: "",
  email: "",
  telegram: "",
  address: "",
  showroom_hours: "",
  company_name: "",
  requisites: "",
  logo_url: "",
};

export default function AdminSettingsEditPage() {
  const router = useRouter();
  const [form, setForm] = useState<ContactSettingsForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUseSupabase = !!supabase;

  useEffect(() => {
    if (!canUseSupabase) return;
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSupabase]);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase!
      .from("contact_settings")
      .select(
        "id, phone, email, telegram, address, showroom_hours, company_name, requisites, logo_url"
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setError("Не удалось загрузить настройки контактов");
    } else if (data) {
      setForm({
        id: data.id,
        phone: data.phone ?? "",
        email: data.email ?? "",
        telegram: data.telegram ?? "",
        address: data.address ?? "",
        showroom_hours: data.showroom_hours ?? "",
        company_name: data.company_name ?? "",
        requisites: data.requisites ?? "",
        logo_url: data.logo_url ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setLoading(false);
  }

  function handleChange<K extends keyof ContactSettingsForm>(
    key: K,
    value: ContactSettingsForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseSupabase) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        phone: form.phone || null,
        email: form.email || null,
        telegram: form.telegram || null,
        address: form.address || null,
        showroom_hours: form.showroom_hours || null,
        company_name: form.company_name || null,
        requisites: form.requisites || null,
        logo_url: form.logo_url || null,
      };

      if (form.id) {
        const { error } = await supabase!
          .from("contact_settings")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase!
          .from("contact_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setForm((prev) => ({ ...prev, id: (data as { id: string }).id }));
      }

      setSuccess("Настройки успешно сохранены");
      router.push("/admin/settings");
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить настройки контактов");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Редактирование настроек</h1>
        <p className="text-sm text-muted-foreground">
          Измени контактную информацию, адрес, логотип и реквизиты, которые используются
          на сайте.
        </p>
      </header>

      {!canUseSupabase && (
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-md border bg-background p-4 md:p-6"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Телефон</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+375 (___) ___-__-__"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telegram</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.telegram}
                  onChange={(e) => handleChange("telegram", e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Режим работы шоурума</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.showroom_hours}
                  onChange={(e) => handleChange("showroom_hours", e.target.value)}
                  placeholder="ежедневно с 10:00 до 20:00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Адрес шоурума</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px]"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="г. Ваш город, улица Примерная, дом 1, павильон «Баня»"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">URL логотипа</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.logo_url}
                onChange={(e) => handleChange("logo_url", e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Ссылка на картинку логотипа, который используется в шапке сайта.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Название компании</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="ИП Иванов Иван Иванович"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Реквизиты</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={form.requisites}
                onChange={(e) => handleChange("requisites", e.target.value)}
                placeholder="ИНН / ОГРНИП, банковские реквизиты и т.п."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving || !canUseSupabase}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/admin/settings")}
                disabled={saving}
              >
                Отмена
              </Button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}


