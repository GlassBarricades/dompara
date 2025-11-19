'use client';

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/banners", label: "Баннеры главной" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/subcategories", label: "Подкатегории" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/attributes", label: "Характеристики" },
  { href: "/admin/attributes-assign", label: "Назначения характеристик" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/orders", label: "Заявки" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Боковое меню для десктопа */}
      <aside className="hidden w-64 border-r bg-muted/40 p-4 md:block">
        <div className="mb-6 font-semibold">Админка</div>
        <nav className="space-y-1 text-sm">
          {adminLinks.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded px-2 py-1 transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Верхняя панель + бургер для мобильных */}
        <div className="sticky top-0 z-20 border-b bg-background/90 px-3 py-2 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Админка</div>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm"
              aria-label="Открыть меню админки"
            >
              {mobileOpen ? "Закрыть" : "Меню"}
            </button>
          </div>
          {mobileOpen && (
            <nav className="mt-3 space-y-1 text-sm">
              {adminLinks.map((link) => {
                const active = pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded px-2 py-2 transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
