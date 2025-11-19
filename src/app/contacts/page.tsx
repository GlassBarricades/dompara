import Link from "next/link";
import { getContactSettings } from "@/lib/settings-api";

// Делаем страницу контактов динамической,
// чтобы данные обновлялись при каждом заходе на страницу.
export const revalidate = 0;

export default async function ContactsPage() {
  const settings = await getContactSettings();

  const phone = settings?.phone ?? "+7 (___) ___-__-__";
  const email = settings?.email ?? "info@example.com";
  const telegram = settings?.telegram ?? "@your_username";
  const address =
    settings?.address ?? "г. Ваш город, улица Примерная, дом 1, павильон «Баня»";
  const showroomHours = settings?.showroom_hours ?? "ежедневно с 10:00 до 20:00";
  const companyName = settings?.company_name ?? "ИП Иванов Иван Иванович";
  const requisites =
    settings?.requisites ?? "ИНН / ОГРНИП: ХХХХХХХХХХ / ХХХХХХХХХХХХХ";

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Контакты</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Свяжитесь с нами любым удобным способом: по телефону, в мессенджерах или через
          форму обратной связи. Поможем с подбором оборудования и ответим на вопросы по
          доставке и монтажу.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1.6fr)]">
        {/* Контактная информация */}
        <div className="space-y-6 rounded-lg border bg-background p-4 md:p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Основные контакты</h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                Телефон:{" "}
                <a href="tel:+7XXXXXXXXXX" className="text-primary hover:underline">
                  {phone}
                </a>
              </div>
              <div>
                Email:{" "}
                <a href={`mailto:${email}`} className="text-primary hover:underline">
                  {email}
                </a>
              </div>
              <div>
                Telegram:{" "}
                <Link href={settings?.telegram ? `https://t.me/${settings.telegram.replace("@","")}` : "#"} className="text-primary hover:underline">
                  {telegram}
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Адрес шоурума</h3>
            <p>{address}</p>
            <p>Режим работы: {showroomHours}</p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Реквизиты</h3>
            <p>{companyName}</p>
            <p>{requisites}</p>
          </div>
        </div>

        {/* Карта + форма */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted h-56 md:h-64 flex items-center justify-center text-xs text-muted-foreground">
            {/* Здесь позже можно вставить реальный iframe Яндекс/Google Maps */}
            Карта с расположением шоурума
          </div>

          <div className="rounded-lg border bg-background p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Написать нам</h2>
            <form className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Имя</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Как к вам обращаться"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Телефон или email</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="+7 ... или example@mail.ru"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Сообщение</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Опишите вашу задачу: баня, площадь, пожелания по оборудованию"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Отправить сообщение
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
