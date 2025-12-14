"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "./button";
import { toast } from "sonner";

interface CartDropdownProps {
  children: React.ReactNode;
}

export const CartDropdown = observer(function CartDropdown({
  children,
}: CartDropdownProps) {
  const cart = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const cartItems = cart.itemsList;
  const hasItems = cartItems.length > 0;

  const handleRemoveItem = (id: string) => {
    const item = cart.items.get(id);
    if (item) {
      cart.removeItem(id);
      toast.success(`${item.name} удалён из корзины`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Корзина</h3>
              <span className="text-sm text-muted-foreground">
                {cart.totalCount} {cart.totalCount === 1 ? "товар" : "товаров"}
              </span>
            </div>
          </div>

          {!hasItems ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Корзина пуста
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b p-4 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.price.toLocaleString("ru-RU")} BYN × {item.quantity}
                      </div>
                      <div className="text-sm font-semibold mt-1">
                        {(item.price * item.quantity).toLocaleString("ru-RU")} BYN
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex-shrink-0"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t space-y-3 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Итого:</span>
                  <span className="text-lg font-semibold">
                    {cart.totalPrice.toLocaleString("ru-RU")} BYN
                  </span>
                </div>
                <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
                  <Link href="/cart">Перейти в корзину</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

