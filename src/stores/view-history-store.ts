import { makeAutoObservable, runInAction } from 'mobx'

const VIEW_HISTORY_STORAGE_KEY = 'dompara_view_history'
const MAX_HISTORY_ITEMS = 15

export interface ViewHistoryItem {
    productId: string
    productSlug: string
    productName: string
    productImage: string | null
    viewedAt: number
}

export class ViewHistoryStore {
    items: ViewHistoryItem[] = []
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
            const stored = localStorage.getItem(VIEW_HISTORY_STORAGE_KEY)
            if (stored) {
                const items: ViewHistoryItem[] = JSON.parse(stored)
                runInAction(() => {
                    this.items = items.slice(0, MAX_HISTORY_ITEMS)
                    this.initialized = true
                })
            } else {
                this.initialized = true
            }
        } catch (error) {
            console.error('Failed to load view history from localStorage:', error)
            this.initialized = true
        }
    }

    private saveToStorage() {
        if (!this.initialized || typeof window === 'undefined') {
            return
        }

        try {
            localStorage.setItem(VIEW_HISTORY_STORAGE_KEY, JSON.stringify(this.items.slice(0, MAX_HISTORY_ITEMS)))
        } catch (error) {
            console.error('Failed to save view history to localStorage:', error)
        }
    }

    add(item: Omit<ViewHistoryItem, 'viewedAt'>) {
        // Удаляем существующий элемент, если он есть
        this.items = this.items.filter((i) => i.productId !== item.productId)

        // Добавляем новый элемент в начало
        const newItem: ViewHistoryItem = {
            ...item,
            viewedAt: Date.now(),
        }
        this.items.unshift(newItem)

        // Ограничиваем количество элементов
        if (this.items.length > MAX_HISTORY_ITEMS) {
            this.items = this.items.slice(0, MAX_HISTORY_ITEMS)
        }

        this.saveToStorage()
    }

    remove(productId: string) {
        this.items = this.items.filter((i) => i.productId !== productId)
        this.saveToStorage()
    }

    clear() {
        this.items = []
        this.saveToStorage()
    }

    get recentItems() {
        return this.items.slice(0, 10)
    }
}
