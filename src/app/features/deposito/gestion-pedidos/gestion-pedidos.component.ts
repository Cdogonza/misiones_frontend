import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { PdfService } from '../../../core/services/pdf.service';
import { OrderEditService } from '../../../core/services/order-edit.service';

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

  // Búsqueda
  searchActive: string = '';
  searchInactive: string = '';

  // Devolución
  isReturning = false;
  returnObservations = '';
  pedidoParaDevolver: any = null;

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
    public orderEditService: OrderEditService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.loadData();
    this.checkActiveEditSession();
  }

  checkActiveEditSession(): void {
    if (this.orderEditService.isActive) {
      this.orderEditService.activePedido$.subscribe(pedido => this.selectedPedido = pedido);
      this.orderEditService.editForm$.subscribe(form => {
        if (form) {
          this.editForm = form;
          this.isEditing = true;
        }
      });
    }
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

  applyFilter(filter?: 'activos' | 'inactivos'): void {
    if (filter) this.activeFilter = filter;

    // Término de búsqueda según el filtro activo
    const term = (this.activeFilter === 'activos' ? this.searchActive : this.searchInactive).toLowerCase();

    let baseList = [];
    if (this.activeFilter === 'activos') {
      // Activos: Pendiente, Entregado
      baseList = this.pedidos.filter(p =>
        p.estado === 'pendiente' || p.estado === 'entregado'
      );
    } else {
      // Inactivos: Devuelto
      baseList = this.pedidos.filter(p =>
        p.estado === 'devuelto'
      );
    }

    if (term) {
      this.filteredPedidos = baseList.filter(p =>
        p.idpedido.toString().includes(term) ||
        (p.unidad_destino_nombre && p.unidad_destino_nombre.toLowerCase().includes(term))
      );
    } else {
      this.filteredPedidos = baseList;
    }
  }

  countByFilter(type: 'activos' | 'inactivos'): number {
    if (type === 'activos') {
      return this.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'entregado').length;
    }
    return this.pedidos.filter(p => p.estado === 'devuelto').length;
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

  descargarPdf(pedido: any, type: 'entrega' | 'recepcion' = 'entrega'): void {
    if (!pedido.detalle) {
      alert('Cargando detalles del pedido...');
      return;
    }
    this.pdfService.generateReceiptPDF(pedido, pedido.detalle, this.unidades, type);
  }

  // --- MÉTODOS DE DEVOLUCIÓN ---
  openReturnModal(pedido: any): void {
    this.isReturning = true;
    this.pedidoParaDevolver = pedido;
    this.returnObservations = '';
  }

  closeReturnModal(): void {
    this.isReturning = false;
    this.pedidoParaDevolver = null;
    this.returnObservations = '';
  }

  confirmReturn(): void {
    if (!this.pedidoParaDevolver) return;
    
    this.loading = true;
    this.dataService.updatePedidoEstado(this.pedidoParaDevolver.idpedido, 'devuelto', this.returnObservations).subscribe({
      next: () => {
        alert('Pedido devuelto con éxito.');
        // Generar boleta de recepción automáticamente
        const updatedPedido = { ...this.pedidoParaDevolver, estado: 'devuelto', observaciones_devolucion: this.returnObservations };
        this.descargarPdf(updatedPedido, 'recepcion');
        
        this.closeReturnModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al devolver pedido:', err);
        alert('Error al procesar la devolución.');
        this.loading = false;
      }
    });
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

    const initialForm = {
      codigo_unidad_destino: pedido.codigo_unidad_destino,
      fecha_inicio: formatDate(pedido.fecha_inicio),
      fecha_fin: formatDate(pedido.fecha_fin),
      observaciones: pedido.observaciones || '',
      items: JSON.parse(JSON.stringify(pedido.detalle || [])) // Clonar items
    };

    this.editForm = initialForm;
    this.orderEditService.startEdit(pedido, initialForm);
  }

  removeItemFromEdit(index: number): void {
    this.editForm.items.splice(index, 1);
    this.orderEditService.updateForm(this.editForm);
  }

  goToAddItems(): void {
    // Guardar estado actual antes de navegar
    this.orderEditService.updateForm(this.editForm);
    this.router.navigate(['/deposito'], { queryParams: { editMode: 'true' } });
  }

  canIncreaseQuantity(item: any): boolean {
    const comp = this.allComponents.find(c => c.codigo_componente === item.codigo_componente);
    if (!comp) return true; // Si no lo encontramos, permitimos por ahora
    return item.cantidad < (comp.total || 0);
  }

  increaseQuantity(item: any): void {
    if (this.canIncreaseQuantity(item)) {
      item.cantidad++;
      this.orderEditService.updateForm(this.editForm);
    } else {
      alert('No hay más stock disponible para este componente.');
    }
  }

  decreaseQuantity(item: any): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      this.orderEditService.updateForm(this.editForm);
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedPedido = null;
    this.orderEditService.clear();
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
        this.orderEditService.clear();
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
