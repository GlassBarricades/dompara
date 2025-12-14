"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ViewHistoryStore } from "./view-history-store";

const ViewHistoryStoreContext = createContext<ViewHistoryStore | null>(null);

export function ViewHistoryProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new ViewHistoryStore());

  return (
    <ViewHistoryStoreContext.Provider value={store}>
      {children}
    </ViewHistoryStoreContext.Provider>
  );
}

export function useViewHistoryStore() {
  const store = useContext(ViewHistoryStoreContext);
  if (!store) {
    throw new Error(
      "useViewHistoryStore must be used within ViewHistoryProvider"
    );
  }
  return store;
}

