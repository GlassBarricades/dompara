'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { FavoritesStore } from './favorites-store'

const FavoritesStoreContext = createContext<FavoritesStore | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new FavoritesStore())

    return <FavoritesStoreContext.Provider value={store}>{children}</FavoritesStoreContext.Provider>
}

export function useFavoritesStore() {
    const store = useContext(FavoritesStoreContext)
    if (!store) {
        throw new Error('useFavoritesStore must be used within FavoritesProvider')
    }
    return store
}
