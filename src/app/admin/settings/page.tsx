import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getContactSettings } from "@/lib/settings-api";

export default async function AdminSettingsPage() {
  const settings = await getContactSettings();

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Настройки контактов</h1>
          <p className="text-sm text-muted-foreground">
            Данные, которые отображаются на странице «Контакты» и используются при
            коммуникации с клиентами.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/settings/edit">Редактировать</Link>
        </Button>
      </header>

      {!settings ? (
        <p className="text-sm text-muted-foreground">
          Настройки ещё не заданы. Нажмите «Редактировать», чтобы заполнить их.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-md border bg-background p-4 md:p-6">
            <div className="grid gap-3 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Телефон</div>
                <div className="font-medium">
                  {settings.phone || <span className="text-muted-foreground">не задан</span>}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Email</div>
                <div className="font-medium">
                  {settings.email || <span className="text-muted-foreground">не задан</span>}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Telegram</div>
                <div className="font-medium">
                  {settings.telegram || (
                    <span className="text-muted-foreground">не задан</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">
                  Режим работы шоурума
                </div>
                <div className="font-medium">
                  {settings.showroom_hours || (
                    <span className="text-muted-foreground">не задан</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Адрес шоурума</div>
                <div className="text-sm">
                  {settings.address || (
                    <span className="text-muted-foreground">не задан</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">
                  Название компании
                </div>
                <div className="font-medium">
                  {settings.company_name || (
                    <span className="text-muted-foreground">не задано</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Реквизиты</div>
                <div className="whitespace-pre-wrap text-sm">
                  {settings.requisites || (
                    <span className="text-muted-foreground">не заданы</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-md border bg-background p-4 md:p-6 text-sm">
            <div className="space-y-2">
              <div className="text-xs uppercase text-muted-foreground">Логотип</div>
              {settings.logo_url ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <img
                      src={settings.logo_url}
                      alt="Логотип"
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <a
                    href={settings.logo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline-offset-4 hover:underline break-all"
                  >
                    {settings.logo_url}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Логотип не задан</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Эти настройки используются на странице контактов и в интерфейсе сайта.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

