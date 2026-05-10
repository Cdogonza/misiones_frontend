import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { PdfService } from '../../../core/services/pdf.service';
import { OrderEditService } from '../../../core/services/order-edit.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

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
  activeFilter: 'activos' | 'inactivos' | 'borradores' = 'activos';
  loading = false;
  selectedPedido: any = null;
  unidades: any[] = [];
  allComponents: any[] = []; // Para poder agregar nuevos items al editar

  // Búsqueda
  searchActive: string = '';
  searchInactive: string = '';
  searchDrafts: string = '';

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
    public dataService: DataService,
    private pdfService: PdfService,
    public orderEditService: OrderEditService,
    private router: Router,
    private route: ActivatedRoute,
    public cartService: CartService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    
    // Leer filtro inicial de la URL
    const initialFilter = this.route.snapshot.queryParamMap.get('filter');
    if (initialFilter === 'borradores' || initialFilter === 'inactivos' || initialFilter === 'activos') {
      this.activeFilter = initialFilter as any;
    }

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

  applyFilter(filter?: 'activos' | 'inactivos' | 'borradores'): void {
    if (filter) this.activeFilter = filter;

    // Término de búsqueda según el filtro activo
    let term = '';
    if (this.activeFilter === 'activos') term = this.searchActive;
    else if (this.activeFilter === 'inactivos') term = this.searchInactive;
    else term = this.searchDrafts;
    
    term = term.toLowerCase();

    let baseList = [];
    if (this.activeFilter === 'activos') {
      // Activos: Pendiente, Entregado
      baseList = this.pedidos.filter(p =>
        p.estado === 'pendiente' || p.estado === 'entregado'
      );
    } else if (this.activeFilter === 'inactivos') {
      // Inactivos: Devuelto, Rechazado
      baseList = this.pedidos.filter(p =>
        p.estado === 'devuelto' || p.estado === 'rechazado'
      );
    } else {
      // Borradores
      baseList = this.pedidos.filter(p => p.estado === 'borrador');
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

  countByFilter(type: 'activos' | 'inactivos' | 'borradores'): number {
    if (type === 'activos') {
      return this.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'entregado').length;
    }
    if (type === 'inactivos') {
      return this.pedidos.filter(p => p.estado === 'devuelto' || p.estado === 'rechazado').length;
    }
    return this.pedidos.filter(p => p.estado === 'borrador').length;
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

  eliminarPedido(pedido: any): void {
    if (!confirm(`¿Estás seguro de eliminar el pedido #${pedido.idpedido}? Esta acción no se puede deshacer.`)) return;

    this.loading = true;
    this.dataService.deletePedido(pedido.idpedido).subscribe({
      next: () => {
        alert('Pedido eliminado con éxito.');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al eliminar pedido:', err);
        alert('Hubo un error al eliminar el pedido.');
        this.loading = false;
      }
    });
  }

  resumeDraft(pedido: any): void {
    this.startEdit(pedido);
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

  guardarCambios(nuevoEstado?: string): void {
    if (!this.selectedPedido) return;

    // Si el usuario intenta confirmar (pasar a pendiente) o si ya era un pedido confirmado, exigimos campos obligatorios
    const finalStatus = nuevoEstado || this.selectedPedido.estado;
    
    if (finalStatus !== 'borrador') {
      if (!this.editForm.codigo_unidad_destino || !this.editForm.fecha_inicio || !this.editForm.fecha_fin) {
        alert('⚠️ Campos requeridos para la confirmación:\n\nPara confirmar y procesar este pedido, es obligatorio ingresar la Unidad de Destino, la Fecha de Inicio y la Fecha de Fin.');
        return;
      }
    }

    if (this.editForm.items.length === 0) {
      alert('El pedido debe tener al menos un componente.');
      return;
    }

    this.loading = true;
    const dataToSave = { ...this.editForm, estado: finalStatus };

    this.dataService.updatePedido(this.selectedPedido.idpedido, dataToSave).subscribe({
      next: () => {
        alert(finalStatus === 'borrador' ? 'Borrador actualizado.' : 'Pedido confirmado y enviado con éxito.');
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

  onInventario(): void {
    this.router.navigate(['/deposito']);
  }

  onVerPedido(): void {
    this.router.navigate(['/deposito/pedido']);
  }

  onVerBorradores(): void {
    this.applyFilter('borradores');
  }

  goToRepuestos(): void {
    this.router.navigate(['/repuestos']);
  }

  goToSelector(): void {
    this.router.navigate(['/selector']);
  }

  openUnitsModal(): void {
    this.router.navigate(['/deposito'], { queryParams: { openUnits: 'true' } });
  }

  onVolverEdicion(): void {
    this.isEditing = true;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'status-pending';
      case 'aprobado': return 'status-approved';
      case 'entregado': return 'status-delivered';
      case 'devuelto': return 'status-returned';
      case 'rechazado': return 'status-rejected';
      case 'borrador': return 'status-draft';
      default: return '';
    }
  }
}
