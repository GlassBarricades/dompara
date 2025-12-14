"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { useFavoritesStore } from "@/stores/favorites-context";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { getProductsByIds } from "@/lib/catalog-api";
import type { Product } from "@/lib/catalog-api";
import { toast } from "sonner";

export const FavoritesClient = observer(function FavoritesClient() {
  const favorites = useFavoritesStore();
  const cart = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      const ids = favorites.idsList;
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedProducts = await getProductsByIds(ids);
        // Сохраняем порядок избранного
        const ordered = ids
          .map((id) => fetchedProducts.find((p) => p.id === id))
          .filter((p): p is Product => p !== undefined);
        setProducts(ordered);
      } catch (error) {
        console.error("Failed to load favorites", error);
        toast.error("Не удалось загрузить избранное");
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [favorites.idsList]);

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
    });
    toast.success(`${product.name} добавлен в корзину`);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground mb-4">
          В избранном пока нет товаров
        </p>
        <Button asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="relative flex flex-col rounded-lg border bg-background p-4 transition-colors hover:bg-accent hover:shadow-md"
          >
            <Link href={`/product/${product.slug}`} className="flex-1">
              <div className="mb-3 flex h-56 items-center justify-center overflow-hidden rounded-md border bg-muted relative">
                {product.main_image_url ? (
                  <Image
                    src={product.main_image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Нет изображения
                  </span>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton
                    productId={product.id}
                    productName={product.name}
                    variant="ghost"
                    size="icon-sm"
                    className="bg-background/80 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Товар
                </div>
                <div className="font-medium">{product.name}</div>
                {product.short_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.short_description.replace(/<[^>]*>/g, "")}
                  </p>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {product.price.toLocaleString("ru-RU")} BYN
                  </div>
                </div>
              </div>
            </Link>
            <div className="mt-3 pt-3 border-t">
              <Button
                onClick={() => handleAddToCart(product)}
                className="w-full"
                size="sm"
              >
                В корзину
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

