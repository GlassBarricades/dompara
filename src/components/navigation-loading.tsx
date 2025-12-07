"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Небольшая задержка перед показом индикатора для мгновенных переходов
    const showTimeout = setTimeout(() => {
      setIsLoading(true);
      setLoadingProgress(10);
    }, 100);

    // Симуляция прогресса загрузки
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Завершаем загрузку
    const completeTimeout = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }, 500);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted/30">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out shadow-lg shadow-primary/50"
        style={{ width: `${loadingProgress}%` }}
      />
    </div>
  );
}
