import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { CategorySlider } from "@/components/home/category-slider";
import { ReviewsSlider } from "@/components/home/reviews-slider";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { FAQSection } from "@/components/home/faq-section";
import { getHomepageBanners } from "@/lib/homepage-banners-api";
import { getCategories, getFeaturedProducts } from "@/lib/catalog-api";
import { getActiveReviews } from "@/lib/reviews-api";

export const revalidate = 0;

export default async function Home() {
  const [banners, categories, reviews, featuredProducts] = await Promise.all([
    getHomepageBanners(),
    getCategories(),
    getActiveReviews(),
    getFeaturedProducts(),
  ]);

  return (
    <div>
      {/* Hero – слайдер баннеров из админки */}
      <HeroSlider banners={banners} />

      {/* Слайдер категорий каталога */}
      <CategorySlider categories={categories} />

      {/* Популярные товары */}
      <FeaturedProducts products={featuredProducts} />

      {/* Отзывы клиентов */}
      <ReviewsSlider reviews={reviews} />

      {/* Почему выбирают нас */}
      <WhyChooseUs />

      {/* FAQ */}
      <FAQSection />

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
