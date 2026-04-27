import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/data.model';

@Injectable({
  providedIn: 'root'
})
export class OrderEditService {
  private activePedido = new BehaviorSubject<any>(null);
  activePedido$ = this.activePedido.asObservable();

  private editForm = new BehaviorSubject<any>(null);
  editForm$ = this.editForm.asObservable();

  private isEditing = new BehaviorSubject<boolean>(false);
  isEditing$ = this.isEditing.asObservable();

  startEdit(pedido: any, form: any): void {
    this.activePedido.next(pedido);
    this.editForm.next(JSON.parse(JSON.stringify(form))); // Clonar
    this.isEditing.next(true);
  }

  updateForm(form: any): void {
    this.editForm.next(form);
  }

  addItem(item: CartItem): void {
    const currentForm = this.editForm.value;
    if (!currentForm) return;

    const existingIndex = currentForm.items.findIndex((i: any) => 
      (i.codigo_componente || i.componentId) === item.componentId
    );

    if (existingIndex > -1) {
      currentForm.items[existingIndex].cantidad += item.cantidad;
    } else {
      // Mapear al formato esperado por el componente de edición
      currentForm.items.push({
        codigo_componente: item.componentId,
        componente: item.nombre,
        cantidad: item.cantidad
      });
    }
    this.editForm.next(currentForm);
  }

  removeItem(index: number): void {
    const currentForm = this.editForm.value;
    if (currentForm && currentForm.items) {
      currentForm.items.splice(index, 1);
      this.editForm.next(currentForm);
    }
  }

  getQuantityById(componentId: number): number {
    const currentForm = this.editForm.value;
    if (!currentForm || !currentForm.items) return 0;
    const item = currentForm.items.find((i: any) => 
      (i.codigo_componente || i.componentId) === componentId
    );
    return item ? item.cantidad : 0;
  }

  clear(): void {
    this.activePedido.next(null);
    this.editForm.next(null);
    this.isEditing.next(false);
  }

  get isActive(): boolean {
    return this.isEditing.value;
  }
}
