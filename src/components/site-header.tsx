'use client';

import Link from "next/link";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useCartStore } from "@/stores/cart-context";
import { Button } from "@/components/ui/button";

export const SiteHeader = observer(function SiteHeader() {
  const cart = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = cart.totalCount;

  const navLinks = [
    { href: "/catalog", label: "Каталог" },
    { href: "/delivery", label: "Доставка и оплата" },
    { href: "/about", label: "О компании" },
    { href: "/contacts", label: "Контакты" },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold tracking-tight">
            Всё для бани
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            магазин товаров для бани
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart">
            <Button variant="outline" size="icon-sm" className="relative">
              🧺
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/cart">
            <Button variant="outline" size="icon-sm" className="relative">
              🧺
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Открыть меню"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </Button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {menuOpen && (
        <nav className="border-t bg-background px-4 py-3 md:hidden">
          <div className="container mx-auto flex flex-col gap-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-1 text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
});

