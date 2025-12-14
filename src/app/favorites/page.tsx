import Link from "next/link";
import { Suspense } from "react";
import { getProductsByIds } from "@/lib/catalog-api";
import { FavoritesClient } from "./favorites-client";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";

export const revalidate = 60;

export default async function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Избранное", href: undefined },
        ]}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Избранное</h1>
        <p className="text-sm text-muted-foreground">
          Товары, которые вы добавили в избранное
        </p>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Загрузка...</div>}>
        <FavoritesClient />
      </Suspense>
    </main>
  );
}

