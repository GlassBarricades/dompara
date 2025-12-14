"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client-browser";

export const dynamic = 'force-dynamic';

const adminLinks = [
  { href: "/admin/cashier", label: "💼 Рабочее место менеджера" },
  { href: "/admin/orders", label: "Заявки" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/products/stock", label: "Остатки товаров" },
  { href: "/admin/products/inventory", label: "Инвентаризация" },
  { href: "/admin/products/invoices", label: "Накладные" },
  { href: "/admin/products/stock-logs", label: "Логи остатков" },
  { href: "/admin/banners", label: "Баннеры главной" },
  { href: "/admin/features", label: "Преимущества" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/subcategories", label: "Подкатегории" },
  { href: "/admin/attributes", label: "Характеристики" },
  { href: "/admin/attributes-assign", label: "Назначения характеристик" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/pages", label: "Страницы" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Исключаем страницу логина из layout
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Для страницы логина не проверяем авторизацию
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, isLoginPage]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  // Для страницы логина рендерим без layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware перенаправит на /admin/login
  }

  return (
    <div className="flex min-h-screen">
      {/* Боковое меню для десктопа */}
      <aside className="hidden w-64 border-r bg-muted/40 p-4 md:block">
        <div className="mb-6 space-y-2">
          <div className="font-semibold">Админка</div>
          <div className="text-xs text-muted-foreground">
            {user.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-xs"
          >
            Выйти
          </Button>
        </div>
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
              <div className="mb-2 px-2 py-1 text-xs text-muted-foreground">
                {user.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-xs mb-2"
              >
                Выйти
              </Button>
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
