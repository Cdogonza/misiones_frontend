import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-pedidos.component.html',
  styleUrl: './gestion-pedidos.component.scss'
})
export class GestionPedidosComponent implements OnInit {
  pedidos: any[] = [];
  filteredPedidos: any[] = [];
  activeFilter: 'activos' | 'inactivos' = 'activos';
  loading = false;
  selectedPedido: any = null;
  unidades: any[] = [];

  constructor(
    private dataService: DataService,
    private pdfService: PdfService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadData();
  }

  loadData(): void {
    // Necesitamos las unidades para algunos mapeos locales si el backend no los trae todos
    this.dataService.getUnidades().subscribe(u => this.unidades = u);

    this.dataService.getAllPedidos().subscribe({
      next: (data) => {
        this.pedidos = data;
        this.applyFilter(this.activeFilter);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.loading = false;
      }
    });
  }

  applyFilter(filter: 'activos' | 'inactivos'): void {
    this.activeFilter = filter;
    if (filter === 'activos') {
      // Activos: Pendiente, Aprobado, Entregado
      this.filteredPedidos = this.pedidos.filter(p => 
        p.estado === 'pendiente' || p.estado === 'aprobado' || p.estado === 'entregado'
      );
    } else {
      // Inactivos: Rechazado, Devuelto
      this.filteredPedidos = this.pedidos.filter(p => 
        p.estado === 'rechazado' || p.estado === 'devuelto'
      );
    }
  }

  countByFilter(type: 'activos' | 'inactivos'): number {
    if (type === 'activos') {
      return this.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'aprobado' || p.estado === 'entregado').length;
    }
    return this.pedidos.filter(p => p.estado === 'rechazado' || p.estado === 'devuelto').length;
  }

  viewDetails(pedido: any): void {
    this.selectedPedido = pedido;
  }

  closeDetails(): void {
    this.selectedPedido = null;
  }

  cambiarEstado(pedido: any, nuevoEstado: string): void {
    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) return;

    this.dataService.updatePedidoEstado(pedido.idpedido, nuevoEstado).subscribe({
      next: () => {
        alert('Estado actualizado con éxito.');
        this.loadData(); // Recargar lista
        if (this.selectedPedido && this.selectedPedido.idpedido === pedido.idpedido) {
          this.selectedPedido.estado = nuevoEstado;
        }
      },
      error: (err) => console.error('Error al actualizar estado:', err)
    });
  }

  descargarPdf(pedido: any): void {
    if (!pedido.detalle) {
      alert('Cargando detalles del pedido...');
      return;
    }
    this.pdfService.generateReceiptPDF(pedido, pedido.detalle, this.unidades);
  }

  goBack(): void {
    this.router.navigate(['/deposito']);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'status-pending';
      case 'aprobado': return 'status-approved';
      case 'entregado': return 'status-delivered';
      case 'devuelto': return 'status-returned';
      case 'rechazado': return 'status-rejected';
      default: return '';
    }
  }
}
