import { makeAutoObservable, runInAction } from "mobx";

const FAVORITES_STORAGE_KEY = "dompara_favorites";

export class FavoritesStore {
  productIds = new Set<string>();
  private initialized = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        runInAction(() => {
          this.productIds = new Set(ids);
          this.initialized = true;
        });
      } else {
        this.initialized = true;
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error);
      this.initialized = true;
    }
  }

  private saveToStorage() {
    if (!this.initialized || typeof window === "undefined") {
      return;
    }

    try {
      const ids = Array.from(this.productIds);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }

  toggle(productId: string) {
    if (this.productIds.has(productId)) {
      this.productIds.delete(productId);
    } else {
      this.productIds.add(productId);
    }
    this.saveToStorage();
  }

  add(productId: string) {
    this.productIds.add(productId);
    this.saveToStorage();
  }

  remove(productId: string) {
    this.productIds.delete(productId);
    this.saveToStorage();
  }

  has(productId: string): boolean {
    return this.productIds.has(productId);
  }

  get count() {
    return this.productIds.size;
  }

  get idsList() {
    return Array.from(this.productIds);
  }

  clear() {
    this.productIds.clear();
    this.saveToStorage();
  }
}

