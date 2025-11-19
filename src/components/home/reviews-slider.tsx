'use client';

import { useEffect, useMemo, useState } from "react";

import type { Review } from "@/lib/reviews-api";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ReviewsSliderProps {
  reviews: Review[];
}

export function ReviewsSlider({ reviews }: ReviewsSliderProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const safeReviews = useMemo(
    () => reviews.filter((r) => r.is_active !== false),
    [reviews],
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

  if (safeReviews.length === 0) return null;

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-500" : "text-muted-foreground/30"}
      >
        ★
      </span>
    ));
  }

  return (
    <section className="bg-muted/30">
      <div className="container mx-auto space-y-6 px-4 py-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Отзывы наших клиентов</h2>
          <p className="text-sm text-muted-foreground">
            Что говорят о нас те, кто уже сделал заказ
          </p>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          setApi={setCarouselApi}
          className="relative"
        >
          <CarouselContent>
            {safeReviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="basis-full md:basis-1/2 lg:basis-1/3"
              >
                <div className="h-full rounded-lg border bg-background p-4 md:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    {review.customer_photo_url ? (
                      <img
                        src={review.customer_photo_url}
                        alt={review.customer_name}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-lg">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{review.customer_name}</div>
                      <div className="text-lg mt-1">{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.text}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {safeReviews.length > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarouselPrevious className="h-8 w-8 border bg-background" />
                <div className="flex gap-1">
                  {safeReviews.map((_, i) => {
                    const isActive = i === current;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => carouselApi?.scrollTo(i)}
                        className={`h-2 rounded-full transition-all ${
                          isActive
                            ? "w-6 bg-primary"
                            : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                        }`}
                        aria-label={`Перейти к отзыву ${i + 1}`}
                      />
                    );
                  })}
                </div>
                <CarouselNext className="h-8 w-8 border bg-background" />
              </div>
              <span className="text-xs text-muted-foreground">
                {current + 1} из {count}
              </span>
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}

