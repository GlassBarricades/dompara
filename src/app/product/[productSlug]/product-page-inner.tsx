"use client";

import Link from "next/link";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";
import type { ProductAttributeDisplay } from "@/lib/catalog-api";
import type { Product } from "@/lib/catalog-api";

type ProductPageInnerProps = {
  product: Product;
  attributes: ProductAttributeDisplay[];
};

export const ProductPageInner = observer(
  ({ product, attributes }: ProductPageInnerProps) => {
    const cart = useCartStore();
    const [justAdded, setJustAdded] = useState(false);

    const images = [
      product.main_image_url,
      ...(Array.isArray(product.gallery) ? product.gallery : []),
    ].filter((src): src is string => !!src);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleAddToCart = () => {
      cart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    };

    return (
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr),minmax(0,1.5fr)]">
          {/* Левая колонка: описание / характеристики */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{product.name}</h1>
                {product.is_featured && (
                  <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white dark:bg-amber-600 dark:text-white">
                    ⭐ Популярный
                  </span>
                )}
                {product.is_custom_order && (
                  <span className="inline-flex items-center rounded-full bg-purple-500 px-2.5 py-1 text-xs font-medium text-white dark:bg-purple-600 dark:text-white">
                    📦 Под заказ
                  </span>
                )}
              </div>
            </div>
            {product.short_description && (
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {attributes.length > 0 && (
              <section className="space-y-2 pt-2">
                <h2 className="text-sm font-semibold">Характеристики</h2>
                <dl className="space-y-2 text-sm">
                  {attributes.map((attr) => {
                    const label = attr.name;
                    const value = formatAttributeValue(attr);
                    if (value == null || value === "") return null;
                    return (
                      <div key={attr.id} className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {label}
                          {attr.unit && (
                            <span className="text-[10px] text-muted-foreground">
                              {" "}
                              ({attr.unit})
                            </span>
                          )}
                        </dt>
                        <dd className="text-right font-medium">{value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            )}
          </div>

          {/* Правая колонка: галерея + карточка покупки */}
          <aside className="space-y-4 rounded-lg border bg-background p-4">
            <div className="space-y-2">
              <div className="overflow-hidden rounded-md border bg-muted flex w-full items-center justify-center h-[260px] sm:h-[320px] md:h-[420px]">
                {images.length > 0 ? (
                  <img
                    src={images[activeIndex]}
                    alt={product.name}
                    className="max-h-[420px] w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Нет изображения товара
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((src, index) => (
                    <button
                      key={src + index}
                      type="button"
                      className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border ${
                        index === activeIndex
                          ? "ring-2 ring-primary"
                          : "opacity-75 hover:opacity-100"
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <img
                        src={src}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">
                  Цена
                </div>
                <div className="text-2xl font-semibold">
                  {product.price.toLocaleString("ru-RU")} BYN
                </div>
              </div>

              {/* Остатки */}
              {!product.is_custom_order &&
                product.stock_quantity !== null &&
                product.stock_quantity !== undefined && (
                  <div className="space-y-1">
                    <div className="text-xs uppercase text-muted-foreground">
                      Остаток
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        product.stock_quantity === 0
                          ? "text-red-600"
                          : product.stock_quantity < 10
                          ? "text-orange-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {product.stock_quantity} шт.
                    </div>
                  </div>
                )}
              {product.is_custom_order && (
                <div className="space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">
                    Доступность
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Товар изготавливается под заказ
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 md:flex-none"
                  disabled={justAdded}
                >
                  {justAdded ? "Добавлено" : "Добавить в корзину"}
                </Button>
                <Link
                  href="/cart"
                  className="px-4 py-2 text-sm text-primary underline-offset-4 hover:underline"
                >
                  Перейти в корзину
                </Link>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Оплата и доставка согласовываются с менеджером после заявки.
                </div>
                <div>
                  При необходимости поможем подобрать аналог или комплект.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    );
  }
);

function formatAttributeValue(attr: ProductAttributeDisplay): string | null {
  const { data_type, value, options } = attr;
  if (value === null || value === undefined) return null;

  switch (data_type) {
    case "string":
      return String(value);
    case "number": {
      const n = Number(value);
      return Number.isNaN(n) ? null : String(n);
    }
    case "boolean":
      return value ? "Да" : "Нет";
    case "select": {
      const val = String(value);
      const opt =
        Array.isArray(options) && options.find((o: any) => o.value === val);
      return opt ? opt.label ?? opt.value : val;
    }
    case "multiselect": {
      const arr = Array.isArray(value) ? value : [];
      if (!arr.length) return null;
      if (!Array.isArray(options)) {
        return arr.join(", ");
      }
      const labels = arr.map((v: any) => {
        const opt = options.find((o: any) => o.value === v);
        return opt ? opt.label ?? opt.value : v;
      });
      return labels.join(", ");
    }
    default:
      return null;
  }
}

