'use client';

import { createContext, useContext, useState, type ReactNode } from "react";
import { CartStore } from "./cart-store";

const CartStoreContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new CartStore());

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}

export function useCartStore() {
  const store = useContext(CartStoreContext);
  if (!store) {
    throw new Error("useCartStore must be used within CartProvider");
  }
  return store;
}


