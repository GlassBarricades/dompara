'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { HomepageBanner } from "@/lib/homepage-banners-api";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface HeroSliderProps {
  banners: HomepageBanner[];
  autoPlayIntervalMs?: number;
}

export function HeroSlider({
  banners,
  autoPlayIntervalMs = 8000,
}: HeroSliderProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const safeBanners = useMemo(
    () => banners.filter((b) => b.is_active !== false),
    [banners],
  );

  useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || safeBanners.length <= 1) return;

    const id = window.setInterval(() => {
      carouselApi.scrollNext();
    }, autoPlayIntervalMs);

    return () => window.clearInterval(id);
  }, [carouselApi, safeBanners.length, autoPlayIntervalMs]);

  if (safeBanners.length === 0) {
    // Фолбэк — простой статический первый экран, если баннеры ещё не заведены
    return (
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
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Carousel
          opts={{ align: "start", loop: true }}
          setApi={setCarouselApi}
          className="relative overflow-hidden rounded-xl border bg-background shadow-sm"
        >
          <CarouselContent className="h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] ml-0">
            {safeBanners.map((banner) => {
              const isPrimaryCatalogCta =
                banner.link_url === "/catalog" ||
                (banner.button_text ?? "")
                  .toLowerCase()
                  .includes("каталог");
              const showSecondaryCatalogButton = !isPrimaryCatalogCta;

              return (
                <CarouselItem key={banner.id} className="pl-0">
                  <div className="relative h-full">
                    {banner.image_url && (
                      <>
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
                      </>
                    )}

                    <div className="relative flex h-full flex-col justify-between px-4 py-6 sm:px-6 md:px-10 md:py-8 lg:px-12">
                      <div className="max-w-xl space-y-3 md:space-y-4">
                        <p className="inline-flex rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/80 backdrop-blur md:text-xs">
                          Магазин товаров для бани
                        </p>
                        <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl">
                          {banner.title}
                        </h1>
                        {banner.subtitle && (
                          <p className="text-xs text-white/80 sm:text-sm md:text-base">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.description && (
                          <p className="hidden text-xs text-white/80 md:block">
                            {banner.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                          {banner.link_url && (
                            <Link
                              href={banner.link_url}
                              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                            >
                              {banner.button_text || "Подробнее"}
                            </Link>
                          )}
                          {showSecondaryCatalogButton && (
                            <Link
                              href="/catalog"
                              className="hidden rounded-md border border-white/60 px-4 py-2 text-xs text-white hover:bg-white/10 sm:inline-flex"
                            >
                              Перейти в каталог
                            </Link>
                          )}
                        </div>

                        {safeBanners.length > 1 && (
                          <div className="hidden items-center gap-2 md:flex">
                            <CarouselPrevious className="border border-white/60 bg-black/30 text-white hover:bg-black/60" />
                            <CarouselNext className="border border-white/60 bg-black/30 text-white hover:bg-black/60" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {safeBanners.length > 1 && (
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex gap-1 sm:gap-2">
                {safeBanners.map((banner, i) => {
                  const isActive = i === current;
                  return (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => carouselApi?.scrollTo(i)}
                      className={`min-h-0 min-w-0 h-1 sm:h-2.5 rounded-full transition-all ${
                        isActive
                          ? "w-2.5 sm:w-6 bg-primary"
                          : "w-1 sm:w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                      }`}
                      aria-label={`Перейти к баннеру ${i + 1}`}
                    />
                  );
                })}
              </div>

              <span className="text-[11px] text-muted-foreground sm:text-xs">
                {current + 1} из {count}
              </span>
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}

