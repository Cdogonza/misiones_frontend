import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartItem } from '../../../core/models/data.model';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido.component.html',
  styleUrl: './pedido.component.scss'
})
export class PedidoComponent implements OnInit {
  cartItems: CartItem[] = [];
  observaciones: string = '';
  loading = false;
  userId: number = 0;

  constructor(
    public cartService: CartService,
    private dataService: DataService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.auth.getProfile().subscribe(profile => {
      this.userId = profile.idusuario;
    });
  }

  removeItem(componentId: number): void {
    this.cartService.removeFromCart(componentId);
  }

  confirmarPedido(): void {
    if (this.cartItems.length === 0) return;
    if (!confirm('¿Estás seguro de que deseas enviar este pedido?')) return;

    this.loading = true;
    // Mapeamos los items del carrito al formato que espera el backend (codigo_componente, cantidad)
    const items = this.cartItems.map(item => ({
      codigo_componente: item.componentId,
      cantidad: item.cantidad
    }));

    this.dataService.createPedido(this.userId, items, this.observaciones).subscribe({
      next: () => {
        alert('Pedido enviado con éxito.');
        this.cartService.clearCart();
        this.router.navigate(['/deposito']);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        alert('Hubo un error al procesar el pedido.');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/deposito']);
  }
}
