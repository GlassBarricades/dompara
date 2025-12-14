"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { useFavoritesStore } from "@/stores/favorites-context";
import { Button } from "@/components/ui/button";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer = observer(function MobileDrawer({
  isOpen,
  onClose,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const [mounted, setMounted] = useState(false);

  // Предотвращаем ошибку гидратации, показывая правильные значения только после монтирования
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? cart.totalCount : 0;
  const favoritesCount = mounted ? favorites.count : 0;

  const navLinks = [
    { href: "/catalog", label: "Каталог" },
    { href: "/delivery", label: "Доставка и оплата" },
    { href: "/about", label: "О компании" },
    { href: "/contacts", label: "Контакты" },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLinkClick = (href: string) => {
    onClose();
    startTransition(() => {
      router.push(href);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl animate-in slide-in-from-left duration-300">
        <div className="flex h-full flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4 bg-white">
            <h2 className="font-semibold text-foreground">Меню</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="touch-manipulation"
            >
              ✕
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white">
            <nav className="flex flex-col p-4 space-y-1">
              {navLinks.map((link, index) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleLinkClick(link.href)}
                    className={`text-left px-4 py-3 rounded-md transition-colors duration-200 touch-manipulation min-h-[44px] animate-in fade-in slide-in-from-left ${
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    style={{
                      animationDelay: `${(index + 1) * 50}ms`,
                    }}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t p-4 space-y-2 bg-white">
            <Link
              href="/favorites"
              onClick={() => {
                onClose();
                startTransition(() => {
                  router.push("/favorites");
                });
              }}
              className={`block ${pathname === "/favorites" ? "opacity-100" : ""}`}
            >
              <Button
                variant="outline"
                className={`w-full justify-start touch-manipulation min-h-[44px] ${
                  pathname === "/favorites"
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <span className="mr-2">{mounted && favoritesCount > 0 ? "❤️" : "🤍"}</span>
                Избранное
                {mounted && favoritesCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link
              href="/cart"
              onClick={() => {
                onClose();
                startTransition(() => {
                  router.push("/cart");
                });
              }}
              className={`block ${pathname === "/cart" ? "opacity-100" : ""}`}
            >
              <Button
                variant="outline"
                className={`w-full justify-start touch-manipulation min-h-[44px] ${
                  pathname === "/cart"
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <span className="mr-2">🧺</span>
                Корзина
                {mounted && cartCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});
