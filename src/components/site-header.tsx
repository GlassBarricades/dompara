"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

export const SiteHeader = observer(function SiteHeader() {
  const cart = useCartStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cartCount = cart.totalCount;

  const navLinks = [
    { href: "/catalog", label: "Каталог" },
    { href: "/delivery", label: "Доставка и оплата" },
    { href: "/about", label: "О компании" },
    { href: "/contacts", label: "Контакты" },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link 
            href="/" 
            className="font-semibold tracking-tight transition-opacity hover:opacity-80 touch-manipulation"
            onClick={() => {
              startTransition(() => {});
            }}
          >
            Всё для бани
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            магазин товаров для бани
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 text-sm lg:flex flex-1 max-w-4xl">
          {/* Поиск */}
          <div className="flex-1 max-w-md">
            <SearchInput />
          </div>

          {navLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  startTransition(() => {});
                }}
                className={`relative transition-colors duration-200 whitespace-nowrap ${
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary transition-all duration-200" />
                )}
              </Link>
            );
          })}
          
          <Link 
            href="/cart"
            onClick={() => {
              startTransition(() => {});
            }}
          >
            <Button variant="outline" size="icon-sm" className="relative transition-transform hover:scale-105 touch-manipulation min-h-[36px] min-w-[36px]">
              🧺
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground animate-in fade-in zoom-in duration-200">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden flex-shrink-0">
          {/* Поиск на мобильных */}
          {searchOpen ? (
            <div className="flex-1">
              <SearchInput onClose={() => setSearchOpen(false)} />
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Поиск"
                onClick={() => setSearchOpen(true)}
                className="touch-manipulation min-h-[36px] min-w-[36px]"
              >
                🔍
              </Button>
              <Link 
                href="/cart"
                onClick={() => {
                  startTransition(() => {});
                }}
              >
                <Button variant="outline" size="icon-sm" className="relative transition-transform hover:scale-105 touch-manipulation min-h-[36px] min-w-[36px]">
                  🧺
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground animate-in fade-in zoom-in duration-200">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Открыть меню"
                onClick={() => setMenuOpen(true)}
                className="touch-manipulation min-h-[36px] min-w-[36px]"
              >
                ☰
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
});
