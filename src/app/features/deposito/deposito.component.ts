import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { CartService } from '../../core/services/cart.service';
import { OrderEditService } from '../../core/services/order-edit.service';
import { UserProfile } from '../../core/models/user.model';
import { Componente, Unidad, CartItem } from '../../core/models/data.model';

@Component({
  selector: 'app-deposito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deposito.component.html',
  styleUrl: './deposito.component.scss'
})
export class DepositoComponent implements OnInit {
  profile: UserProfile = { idusuario: 0, username: '', email: '' };
  loading = false;
  
  // Datos
  components: Componente[] = [];
  depositoBaseUnit: Unidad | null = null;
  searchText = '';
  showTable = false;

  // Carrito UI
  isCartModalOpen = false;
  selectedComponentForCart: Componente | null = null;
  cartQuantity = 1;
  quantityOptions: number[] = [];

  // Modo Edición
  editMode = false;

  constructor(
    public auth: AuthService,
    private dataService: DataService,
    public cartService: CartService,
    public orderEditService: OrderEditService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initDepositoData();
    this.loadProfile();

    this.route.queryParams.subscribe(params => {
      this.editMode = params['editMode'] === 'true' && this.orderEditService.isActive;
    });
  }

  loadProfile(): void {
    this.auth.getProfile().subscribe({
      next: (data) => { this.profile = data; },
      error: () => { console.error('Error al cargar perfil.'); }
    });
  }

  initDepositoData(): void {
    this.loading = true;
    this.dataService.getUnidades().subscribe({
      next: (unidades) => {
        this.depositoBaseUnit = unidades.find(u => 
          u.unidad === 'DEPOSITO BASE'
        ) || null;

        if (this.depositoBaseUnit) {
          this.loadComponents();
        } else {
          this.loading = false;
          console.warn('No se encontró la unidad DEPOSITO BASE');
        }
      },
      error: () => this.loading = false
    });
  }

  loadComponents(): void {
    if (!this.depositoBaseUnit) return;
    this.loading = true;
    this.dataService.getComponentes().subscribe({
      next: (data) => {
        this.components = data.filter(c => c.codigo_unidad === this.depositoBaseUnit?.codigo_unidad);
        this.loading = false;
        this.showTable = true;
      },
      error: () => this.loading = false
    });
  }

  get filteredData(): Componente[] {
    if (!this.searchText) return this.components;
    const search = this.searchText.toLowerCase();
    return this.components.filter(c =>
      c.componente?.toLowerCase().includes(search) ||
      c.serie?.toLowerCase().includes(search) ||
      c.equipo?.toLowerCase().includes(search) ||
      c.Nro_alta?.toLowerCase().includes(search) ||
      c.Nro_baja?.toLowerCase().includes(search) ||
      c.lugar?.toLowerCase().includes(search) ||
      c.ubicacion?.toLowerCase().includes(search) ||
      c.clasificacion?.toLowerCase().includes(search) ||
      c.observacion?.toLowerCase().includes(search)
    );
  }

  onSearch(): void {}

  onVerTodos(): void {
    this.searchText = '';
  }

  onNuevo(): void {
    this.router.navigate(['/dashboard/edit', 'componente', 0], { queryParams: { from: 'deposito' } });
  }

  onNuevoEquipo(): void {
    this.router.navigate(['/dashboard/edit', 'equipo', 0], { queryParams: { from: 'deposito' } });
  }

  onEdit(c: Componente): void {
    this.router.navigate(['/dashboard/edit', 'componente', c.codigo_componente], { queryParams: { from: 'deposito' } });
  }

  onDelete(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este componente del depósito?')) return;
    this.loading = true;
    this.dataService.deleteComponente(id).subscribe({
      next: () => {
        this.components = this.components.filter(c => c.codigo_componente !== id);
        this.loading = false;
        alert('Componente eliminado con éxito.');
      },
      error: (err) => {
        this.loading = false;
        alert('Error al eliminar: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  // Lógica de Carrito
  openCartModal(c: Componente): void {
    const inCart = this.getQuantityInCart(c.codigo_componente);
    const stock = (c.total || 0) - inCart;
    
    if (stock <= 0) {
      alert('Has alcanzado el límite de stock disponible para este componente en tu pedido.');
      return;
    }
    this.selectedComponentForCart = c;
    this.cartQuantity = 1;
    this.quantityOptions = Array.from({ length: stock }, (_, i) => i + 1);
    this.isCartModalOpen = true;
  }

  closeCartModal(): void {
    this.isCartModalOpen = false;
    this.selectedComponentForCart = null;
    this.quantityOptions = [];
  }

  confirmAddToCart(): void {
    if (this.selectedComponentForCart && this.cartQuantity > 0) {
      const item: CartItem = {
        componentId: this.selectedComponentForCart.codigo_componente,
        nombre: this.selectedComponentForCart.componente,
        equipo: this.selectedComponentForCart.equipo || 'N/A',
        serie: this.selectedComponentForCart.serie || '-',
        cantidad: this.cartQuantity
      };

      if (this.editMode) {
        this.orderEditService.addItem(item);
        alert(`${item.nombre} añadido al pedido en edición.`);
      } else {
        this.cartService.addToCart(item);
      }
      
      this.closeCartModal();
    }
  }

  onVerPedido(): void {
    this.router.navigate(['/deposito/pedido']);
  }

  onProfileClick(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  onGestionarPedidos(): void {
    this.router.navigate(['/deposito/gestion']);
  }

  onVolverEdicion(): void {
    this.router.navigate(['/deposito/gestion']);
  }

  goToSelector(): void {
    this.router.navigate(['/selector']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getQuantityInCart(componentId: number): number {
    let qty = this.cartService.getQuantityById(componentId);
    
    // Si estamos en modo edición, también debemos considerar lo que ya está en el formulario de edición
    if (this.orderEditService.isActive) {
      qty += this.orderEditService.getQuantityById(componentId);
    }
    
    return qty;
  }

  getAvailableStock(c: Componente): number {
    return (c.total || 0) - this.getQuantityInCart(c.codigo_componente);
  }
}
