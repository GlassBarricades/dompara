"use client";

import { observer } from "mobx-react-lite";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useViewHistoryStore } from "@/stores/view-history-context";
import { Button } from "@/components/ui/button";

export const ViewHistory = observer(function ViewHistory() {
  const viewHistory = useViewHistoryStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const recentItems = viewHistory.recentItems;

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Вы недавно смотрели</h2>
          <p className="text-sm text-muted-foreground">
            Товары, которые вы просматривали
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => viewHistory.clear()}
          className="text-xs"
        >
          Очистить
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {recentItems.map((item) => (
          <Link
            key={item.productId}
            href={`/product/${item.productSlug}`}
            className="group flex flex-col rounded-lg border bg-background p-3 transition-colors hover:bg-accent hover:shadow-md"
          >
            <div className="relative mb-2 flex h-32 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Нет изображения
                </span>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="line-clamp-2 text-sm font-medium group-hover:text-primary transition-colors">
                {item.productName}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
});

