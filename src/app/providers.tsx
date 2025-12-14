'use client';

import type { ReactNode } from "react";
import { CartProvider } from "@/stores/cart-context";
import { FavoritesProvider } from "@/stores/favorites-context";
import { ViewHistoryProvider } from "@/stores/view-history-context";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <ViewHistoryProvider>
          {children}
        <Toaster 
          position="top-right" 
          richColors
          duration={3000}
          closeButton
          toastOptions={{
            className: "text-sm",
            style: {
              fontSize: "14px",
            },
          }}
        />
        </ViewHistoryProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}


