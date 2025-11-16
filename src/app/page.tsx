import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto flex flex-col gap-8 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-16">
          <div className="max-w-xl space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Всё для настоящей русской бани
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Подберите печь, камни, веники и аксессуары под вашу баню. Сделайте
              заказ без онлайн-оплаты — заявку обработает менеджер.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/catalog"
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Перейти в каталог
              </Link>
              <Link
                href="/delivery"
                className="rounded-md border border-border px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                Доставка и оплата
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-xs text-muted-foreground md:max-w-md md:text-sm">
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium text-foreground">Печи и дымоходы</div>
              <p className="mt-1">
                Для небольших парных и больших комплексов. Подберём по объёму и
                типу топлива.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium text-foreground">Камни и веники</div>
              <p className="mt-1">
                Правильные породы камней и свежие веники для мягкого пара и
                отдыха.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium text-foreground">
                Аксессуары и посуда
              </div>
              <p className="mt-1">
                Шапки, коврики, шайки, термометры и всё, что делает баню
                комфортной.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium text-foreground">Монтаж и помощь</div>
              <p className="mt-1">
                Поможем с подбором и монтажом печи, подскажем по эксплуатации и
                уходу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA блоки */}
      <section className="container mx-auto px-4 space-y-6">
        <h2 className="text-xl font-semibold">Почему удобно заказывать у нас</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border bg-background p-4">
            <div className="font-medium mb-1">Заявка без предоплаты</div>
            <p className="text-muted-foreground">
              Вы оформляете корзину как заявку, менеджер связывается, уточняет
              детали и только потом согласует оплату.
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="font-medium mb-1">Живой менеджер</div>
            <p className="text-muted-foreground">
              Заявка уходит напрямую в Telegram — вам ответит специалист, а не
              автоответчик.
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="font-medium mb-1">Подбор под вашу баню</div>
            <p className="text-muted-foreground">
              Можем подобрать комплект «под ключ» под параметры помещения и ваши
              пожелания по бюджету.
            </p>
          </div>
        </div>
      </section>

      {/* Популярные решения */}
      <section className="bg-muted/40">
        <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Готовые решения под вашу баню</h2>
            <p className="text-sm text-muted-foreground">
              Не нужно разбираться в десятках моделей печей и аксессуаров. Мы собрали
              базовые комплекты для разных типов бань: от компактной дачной до
              просторной семейной.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>— Небольшая баня 6–12 м²: печь, камни, базовый набор аксессуаров</li>
              <li>— Семейная баня 12–20 м²: увеличенный объём печи и камней</li>
              <li>— Премиум-комплекты с декоративной облицовкой и расширенным набором</li>
            </ul>
            <Link
              href="/catalog"
              className="inline-flex items-center text-sm text-primary underline-offset-4 hover:underline"
            >
              Смотреть варианты в каталоге
            </Link>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="flex gap-3 rounded-lg border bg-background p-4">
              <div className="h-20 w-24 flex-shrink-0 rounded-md bg-gradient-to-br from-orange-400 to-amber-600" />
              <div>
                <div className="font-medium">Горячее сердце бани</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Подберём печь под объём парилки, материал стен и ваши предпочтения по
                  режиму парения.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border bg-background p-4">
              <div className="h-20 w-24 flex-shrink-0 rounded-md bg-gradient-to-br from-sky-400 to-emerald-500" />
              <div>
                <div className="font-medium">Правильный пар</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Камни нужных пород, правильный объём и укладка для мягкого и полезного
                  пара.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border bg-background p-4">
              <div className="h-20 w-24 flex-shrink-0 rounded-md bg-gradient-to-br from-stone-400 to-stone-700" />
              <div>
                <div className="font-medium">Уют и безопасность</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Шапки, коврики, деревянная посуда и аксессуары — всё, что делает баню
                  комфортной и безопасной.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как проходит заказ */}
      <section className="container mx-auto px-4 py-10 space-y-6">
        <h2 className="text-xl font-semibold">Как проходит заказ</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              1
            </div>
            <div className="font-medium mb-1">Вы выбираете товары</div>
            <p className="text-muted-foreground">
              Добавляете в корзину товары из каталога и отправляете заявку с
              контактами.
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              2
            </div>
            <div className="font-medium mb-1">Мы уточняем детали</div>
            <p className="text-muted-foreground">
              Менеджер связывается с вами, помогает с выбором и уточняет
              комплектацию.
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              3
            </div>
            <div className="font-medium mb-1">Доставка и монтаж</div>
            <p className="text-muted-foreground">
              Согласовываем удобное время доставки, при необходимости организуем
              монтаж и запуск.
            </p>
          </div>
        </div>
      </section>

      {/* Заключительный CTA */}
      <section className="bg-primary/5">
        <div className="container mx-auto flex flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Готовы собрать вашу идеальную баню</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Оставьте заявку через корзину или свяжитесь с нами по телефону — поможем
              с подбором оборудования и ответим на любые вопросы.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/catalog"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Собрать комплект
            </Link>
            <Link
              href="/contacts"
              className="rounded-md border border-border px-4 py-2 hover:bg-accent hover:text-accent-foreground"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
