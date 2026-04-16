import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartItem, Unidad } from '../../../core/models/data.model';
import { PdfService } from '../../../core/services/pdf.service';
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
  
  // Nuevos campos para configuración del préstamo
  unidades: Unidad[] = [];
  selectedUnidadDestino: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(
    public cartService: CartService,
    private dataService: DataService,
    private auth: AuthService,
    private router: Router,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.auth.getProfile().subscribe(profile => {
      this.userId = profile.idusuario;
    });

    this.loadUnidades();
  }

  loadUnidades(): void {
    this.dataService.getUnidades().subscribe({
      next: (data) => {
        this.unidades = data;
      },
      error: (err) => console.error('Error al cargar unidades:', err)
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

    const config = {
      codigo_unidad_destino: this.selectedUnidadDestino || undefined,
      fecha_inicio: this.fechaInicio || undefined,
      fecha_fin: this.fechaFin || undefined
    };

    this.dataService.createPedido(this.userId, items, this.observaciones, config).subscribe({
      next: (response) => {
        alert('Pedido enviado con éxito.');
        const idpedido = response.idpedido || 0;
        
        // Preparar objeto pedido para el PDF
        const pedidoPdf = {
          idpedido,
          created_at: new Date(),
          codigo_unidad_destino: this.selectedUnidadDestino,
          fecha_inicio: this.fechaInicio,
          fecha_fin: this.fechaFin,
          observaciones: this.observaciones
        };

        this.pdfService.generateReceiptPDF(pedidoPdf, this.cartItems, this.unidades);
        
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
