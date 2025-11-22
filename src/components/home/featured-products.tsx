"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import type { Product } from "@/lib/catalog-api";
import { Button } from "@/components/ui/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const cart = useCartStore();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [mounted, setMounted] = useState(false);

  const safeProducts = useMemo(() => products ?? [], [products]);

  // Определяем, сколько карточек помещается на экране (только на клиенте)
  useEffect(() => {
    setMounted(true);

    function updateSlidesPerView() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width >= 1024) {
        setSlidesPerView(4);
      } else if (width >= 768) {
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

  if (safeProducts.length === 0) return null;

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
    });
  };

  const totalPages = Math.max(
    1,
    Math.ceil(safeProducts.length / Math.max(1, slidesPerView))
  );
  const currentPage = Math.min(
    totalPages,
    Math.floor(current / Math.max(1, slidesPerView)) + 1
  );

  return (
    <section className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Популярные товары</h2>
          <p className="text-sm text-muted-foreground">
            Товары, которые чаще всего выбирают наши клиенты
          </p>
        </div>
        <Link
          href="/catalog"
          className="hidden text-sm text-primary underline-offset-4 hover:underline md:inline-flex"
        >
          Смотреть все товары
        </Link>
      </div>

      <Carousel
        opts={{ align: "start", loop: false }}
        setApi={setCarouselApi}
        className="relative"
      >
        <CarouselContent>
          {safeProducts.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <div className="group flex h-full flex-col rounded-lg border bg-background transition-colors hover:bg-accent">
                <Link href={`/product/${product.slug}`} className="flex-1">
                  <div className="relative h-48 overflow-hidden rounded-t-lg border-b bg-muted">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Нет изображения
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-[10px] font-semibold text-white whitespace-nowrap">
                      <span>★</span>
                      <span>Популярный</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {product.name}
                      </h3>
                      {product.is_custom_order && (
                        <span className="inline-flex items-center rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-purple-600 dark:text-white whitespace-nowrap flex-shrink-0">
                          📦 Под заказ
                        </span>
                      )}
                    </div>
                    {product.short_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: product.short_description,
                          }}
                        />
                      </p>
                    )}
                    <div className="space-y-1 pt-2">
                      {/* Остатки */}
                      {!product.is_custom_order &&
                        product.stock_quantity !== null &&
                        product.stock_quantity !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            Остаток:{" "}
                            <span
                              className={`font-medium ${
                                product.stock_quantity === 0
                                  ? "text-red-600"
                                  : product.stock_quantity < 10
                                  ? "text-orange-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {product.stock_quantity} шт.
                            </span>
                          </div>
                        )}
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">
                          {product.price.toLocaleString("ru-RU")} BYN
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="p-4 pt-0">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                  >
                    В корзину
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {mounted && safeProducts.length > slidesPerView && (
          <div
            className="mt-6 flex items-center justify-between"
            suppressHydrationWarning
          >
            <div className="flex items-center gap-2">
              <CarouselPrevious className="h-8 w-8 border bg-background" />
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      carouselApi?.scrollTo(i * Math.max(1, slidesPerView))
                    }
                    className={`h-2 rounded-full transition-all ${
                      currentPage === i + 1
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                    }`}
                    aria-label={`Перейти к группе товаров ${i + 1}`}
                  />
                ))}
              </div>
              <CarouselNext className="h-8 w-8 border bg-background" />
            </div>
            <span className="text-xs text-muted-foreground">
              {currentPage} из {totalPages}
            </span>
          </div>
        )}
      </Carousel>

      <div className="text-center">
        <Link
          href="/catalog"
          className="inline-flex items-center text-sm text-primary underline-offset-4 hover:underline md:hidden"
        >
          Смотреть все товары
        </Link>
      </div>
    </section>
  );
}

export default observer(FeaturedProducts);
