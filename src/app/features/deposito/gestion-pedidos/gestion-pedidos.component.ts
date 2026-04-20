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
  allComponents: any[] = []; // Para poder agregar nuevos items al editar

  // Edición
  isEditing = false;
  editForm = {
    codigo_unidad_destino: null as number | null,
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: '',
    items: [] as any[]
  };

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
    
    // Necesitamos los componentes para poder agregarlos al editar un pedido
    this.dataService.getComponentes().subscribe(c => this.allComponents = c);

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

  // --- MÉTODOS DE EDICIÓN ---
  startEdit(pedido: any): void {
    this.isEditing = true;
    this.selectedPedido = pedido;
    
    // Mapear fechas para el input de tipo date (YYYY-MM-DD)
    const formatDate = (d: any) => {
        if (!d) return '';
        const date = new Date(d);
        return date.toISOString().split('T')[0];
    };

    this.editForm = {
      codigo_unidad_destino: pedido.codigo_unidad_destino,
      fecha_inicio: formatDate(pedido.fecha_inicio),
      fecha_fin: formatDate(pedido.fecha_fin),
      observaciones: pedido.observaciones || '',
      items: JSON.parse(JSON.stringify(pedido.detalle || [])) // Clonar items
    };
  }

  removeItemFromEdit(index: number): void {
    this.editForm.items.splice(index, 1);
  }

  addItemToEdit(comp: any): void {
    // Evitar duplicados
    const exists = this.editForm.items.find(i => i.codigo_componente === comp.codigo_componente);
    if (exists) {
        exists.cantidad++;
    } else {
        this.editForm.items.push({
            codigo_componente: comp.codigo_componente,
            componente: comp.componente,
            cantidad: 1
        });
    }
  }

  addItemFromSelector(codigoComp: any): void {
    if (!codigoComp) return;
    const comp = this.allComponents.find(c => c.codigo_componente === Number(codigoComp));
    if (comp) {
        this.addItemToEdit(comp);
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedPedido = null;
  }

  guardarCambios(): void {
    if (!this.selectedPedido) return;
    if (!this.editForm.codigo_unidad_destino || !this.editForm.fecha_inicio || !this.editForm.fecha_fin) {
        alert('Por favor, complete los campos obligatorios.');
        return;
    }

    if (this.editForm.items.length === 0) {
        alert('El pedido debe tener al menos un componente.');
        return;
    }

    this.loading = true;
    this.dataService.updatePedido(this.selectedPedido.idpedido, this.editForm).subscribe({
      next: () => {
        alert('Pedido actualizado con éxito.');
        this.isEditing = false;
        this.selectedPedido = null;
        this.loadData();
      },
      error: (err) => {
        console.error('Error al actualizar pedido:', err);
        alert('Hubo un error al guardar los cambios.');
        this.loading = false;
      }
    });
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
