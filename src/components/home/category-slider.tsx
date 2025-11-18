'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { Category } from "@/lib/catalog-api";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CategorySliderProps {
  categories: Category[];
}

export function CategorySlider({ categories }: CategorySliderProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  const safeCategories = useMemo(
    () => categories ?? [],
    [categories],
  );

  // Определяем, сколько карточек помещается на экране
  useEffect(() => {
    function updateSlidesPerView() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width >= 1536) {
        setSlidesPerView(6);
      } else if (width >= 1280) {
        setSlidesPerView(4);
      } else if (width >= 1024) {
        setSlidesPerView(3);
      } else if (width >= 640) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(1);
      }
    }

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

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

  if (safeCategories.length === 0) return null;

  const totalPages = Math.max(
    1,
    Math.ceil(safeCategories.length / Math.max(1, slidesPerView)),
  );
  const currentPage = Math.min(
    totalPages,
    Math.floor(current / Math.max(1, slidesPerView)) + 1,
  );

  return (
    <section className="bg-muted/30">
      <div className="container mx-auto space-y-4 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/catalog"
            className="hidden text-sm text-primary underline-offset-4 hover:underline md:inline-flex"
          >
            Смотреть все категории
          </Link>
        </div>

        <Carousel
          opts={{ align: "start", loop: false }}
          setApi={setCarouselApi}
          className="relative"
        >
          <CarouselContent className="rounded-lg border bg-background">
            {safeCategories.map((category) => (
              <CarouselItem
                key={category.id}
                className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/6"
              >
                <Link
                  href={`/catalog/${category.slug}`}
                  className="group relative flex h-56 flex-col overflow-hidden rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 text-white sm:h-60 md:h-64"
                >
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-4">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/70 sm:text-[11px]">
                        Категория
                      </div>
                      <div className="text-sm font-semibold sm:text-base">
                        {category.name}
                      </div>
                      {category.description && (
                        <p className="hidden text-xs text-white/80 sm:line-clamp-3 sm:block">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <span className="mt-3 inline-flex items-center text-[11px] text-white/90 sm:text-xs">
                      Перейти к товарам
                      <span className="ml-1 text-xs">→</span>
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {safeCategories.length > 1 && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground sm:text-xs">
              <div className="flex items-center gap-2">
                <CarouselPrevious className="h-7 w-7 border bg-background text-xs text-muted-foreground hover:bg-background" />

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        carouselApi?.scrollTo(
                          i * Math.max(1, slidesPerView),
                        )
                      }
                      className={`h-1.5 w-4 rounded-full ${
                        currentPage === i + 1
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      }`}
                      aria-label={`Перейти к группе категорий ${i + 1}`}
                    />
                  ))}
                </div>

                <CarouselNext className="h-7 w-7 border bg-background text-xs text-muted-foreground hover:bg-background" />
              </div>

              <span>
                {currentPage} из {totalPages}
              </span>
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}

