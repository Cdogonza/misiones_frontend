import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/data.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  addToCart(item: CartItem): void {
    const current = this.cartItems.value;
    const existingIndex = current.findIndex(i => i.componentId === item.componentId);

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex].cantidad += item.cantidad;
      this.cartItems.next(updated);
    } else {
      this.cartItems.next([...current, item]);
    }
  }

  removeFromCart(componentId: number): void {
    const current = this.cartItems.value;
    this.cartItems.next(current.filter(i => i.componentId !== componentId));
  }

  clearCart(): void {
    this.cartItems.next([]);
  }

  get totalItemsCount(): number {
    return this.cartItems.value.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get totalUniqueItems(): number {
    return this.cartItems.value.length;
  }

  getQuantityById(componentId: number): number {
    const item = this.cartItems.value.find(i => i.componentId === componentId);
    return item ? item.cantidad : 0;
  }
}
