'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/subcategories", label: "Подкатегории" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/attributes", label: "Характеристики" },
  { href: "/admin/attributes-assign", label: "Назначения характеристик" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/orders", label: "Заявки" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40 p-4">
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
