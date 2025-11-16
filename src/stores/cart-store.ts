import { makeAutoObservable } from "mobx";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export class CartStore {
  items = new Map<string, CartItem>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
    const existing = this.items.get(item.id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    this.items.set(item.id, {
      ...item,
      quantity: nextQuantity,
    });
  }

  removeItem(id: string) {
    this.items.delete(id);
  }

  setQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      this.items.delete(id);
      return;
    }
    const existing = this.items.get(id);
    if (!existing) return;

    this.items.set(id, { ...existing, quantity });
  }

  clear() {
    this.items.clear();
  }

  get itemsList() {
    return Array.from(this.items.values());
  }

  get totalCount() {
    return this.itemsList.reduce((acc, item) => acc + item.quantity, 0);
  }

  get totalPrice() {
    return this.itemsList.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }
}


