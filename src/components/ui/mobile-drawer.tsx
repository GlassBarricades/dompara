"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
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
  const cartCount = cart.totalCount;

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
      <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-background shadow-xl animate-in slide-in-from-left duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="font-semibold">Меню</h2>
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
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-2">
              {navLinks.map((link, index) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleLinkClick(link.href)}
                    className={`text-left px-4 py-3 rounded-md transition-colors touch-manipulation min-h-[44px] ${
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
          <div className="border-t p-4 space-y-2">
            <Link
              href="/cart"
              onClick={() => {
                onClose();
                startTransition(() => {});
              }}
              className="block"
            >
              <Button
                variant="outline"
                className="w-full justify-start touch-manipulation min-h-[44px]"
              >
                <span className="mr-2">🧺</span>
                Корзина
                {cartCount > 0 && (
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
