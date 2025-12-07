import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Suspense } from "react";
import { NavigationLoading } from "@/components/navigation-loading";

export const metadata: Metadata = {
  title: "Магазин для бани",
  description: "Каталог товаров для бани с корзиной и заявками в Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <AppProviders>
          <Suspense fallback={null}>
            <NavigationLoading />
          </Suspense>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
