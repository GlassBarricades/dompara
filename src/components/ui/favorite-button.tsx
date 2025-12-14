"use client";

import { observer } from "mobx-react-lite";
import { useFavoritesStore } from "@/stores/favorites-context";
import { Button } from "./button";
import { toast } from "sonner";

interface FavoriteButtonProps {
  productId: string;
  productName?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
}

export const FavoriteButton = observer(function FavoriteButton({
  productId,
  productName,
  variant = "ghost",
  size = "icon-sm",
  className,
}: FavoriteButtonProps) {
  const favorites = useFavoritesStore();
  const isFavorite = favorites.has(productId);

  const handleToggle = () => {
    favorites.toggle(productId);
    if (isFavorite) {
      toast.success("Удалено из избранного");
    } else {
      toast.success(
        productName ? `${productName} добавлен в избранное` : "Добавлено в избранное"
      );
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={className}
      aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
    >
      {isFavorite ? "❤️" : "🤍"}
    </Button>
  );
});

