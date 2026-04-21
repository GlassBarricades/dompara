import { makeAutoObservable, runInAction } from 'mobx'

export interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
}

const CART_STORAGE_KEY = 'dompara_cart'

export class CartStore {
    items = new Map<string, CartItem>()
    private initialized = false

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true })
        this.loadFromStorage()
    }

    private loadFromStorage() {
        if (this.initialized || typeof window === 'undefined') {
            return
        }

        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY)
            if (stored) {
                const items: CartItem[] = JSON.parse(stored)
                runInAction(() => {
                    items.forEach((item) => {
                        this.items.set(item.id, item)
                    })
                    this.initialized = true
                })
            } else {
                this.initialized = true
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error)
            this.initialized = true
        }
    }

    private saveToStorage() {
        if (!this.initialized || typeof window === 'undefined') {
            return
        }

        try {
            const items = this.itemsList
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        } catch (error) {
            console.error('Failed to save cart to localStorage:', error)
            // Обработка ошибок localStorage (например, quota exceeded или private mode)
        }
    }

    addItem(item: Omit<CartItem, 'quantity'>, quantity = 1) {
        const existing = this.items.get(item.id)
        const nextQuantity = (existing?.quantity ?? 0) + quantity

        this.items.set(item.id, {
            ...item,
            quantity: nextQuantity,
        })
        this.saveToStorage()
    }

    removeItem(id: string) {
        this.items.delete(id)
        this.saveToStorage()
    }

    setQuantity(id: string, quantity: number) {
        if (quantity <= 0) {
            this.items.delete(id)
        } else {
            const existing = this.items.get(id)
            if (!existing) return

            this.items.set(id, { ...existing, quantity })
        }
        this.saveToStorage()
    }

    clear() {
        this.items.clear()
        this.saveToStorage()
    }

    get itemsList() {
        return Array.from(this.items.values())
    }

    get totalCount() {
        return this.itemsList.reduce((acc, item) => acc + item.quantity, 0)
    }

    get totalPrice() {
        return this.itemsList.reduce((acc, item) => acc + item.price * item.quantity, 0)
    }
}
