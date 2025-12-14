"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в консоль или сервис мониторинга
    console.error("Admin error:", error);
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">Ошибка в админ-панели</h1>
          <p className="text-muted-foreground">
            Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте снова.
          </p>
        </div>

        {error.message && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Попробовать снова
          </Button>
          <Button onClick={() => window.location.href = "/admin"} variant="outline">
            На дашборд
          </Button>
        </div>
      </div>
    </main>
  );
}

