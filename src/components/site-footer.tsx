import Link from "next/link";
import { getContactSettings } from "@/lib/settings-api";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const settings = await getContactSettings();
  const phone = settings?.phone ?? "+375 (___) ___-__-__";

  const footerLinks = {
    catalog: [
      { href: "/catalog", label: "Каталог товаров" },
      { href: "/catalog?featured=true", label: "Популярные товары" },
    ],
    info: [
      { href: "/delivery", label: "Доставка и оплата" },
      { href: "/about", label: "О компании" },
      { href: "/contacts", label: "Контакты" },
    ],
    support: [
      { href: "/faq", label: "FAQ" },
      { href: "/guarantees", label: "Гарантии" },
      { href: "/contacts", label: "Связаться с нами" },
    ],
  };

  const socialLinks = [
    { href: "#", label: "Telegram", icon: "📱" },
    { href: "#", label: "Viber", icon: "💬" },
    { href: "#", label: "Instagram", icon: "📷" },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* О компании */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">О компании</h3>
            <p className="text-xs text-muted-foreground">
              Всё для бани — ваш надёжный партнёр в создании идеальной бани.
              Качественные товары, профессиональная консультация и быстрая доставка.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors touch-manipulation"
                  aria-label={social.label}
                >
                  <span className="text-sm">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Каталог */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Каталог</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[32px] inline-flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Информация */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Информация</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[32px] inline-flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Поддержка */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[32px] inline-flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div>© {year} Всё для бани. Все права защищены.</div>
          <div className="flex flex-wrap gap-2">
            <span>Телефон: {phone}</span>
            <span className="hidden sm:inline">·</span>
            <span>Режим работы: ежедневно</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
