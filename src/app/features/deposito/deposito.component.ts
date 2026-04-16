import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { CartService } from '../../core/services/cart.service';
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

  constructor(
    public auth: AuthService,
    private dataService: DataService,
    public cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initDepositoData();
    this.loadProfile();
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
          u.nombre_de_la_unidad.toUpperCase() === 'DEPOSITO BASE' || 
          u.unidad.toUpperCase() === 'DEPOSITO BASE'
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
      c.serie?.toLowerCase().includes(search)
    );
  }

  onSearch(): void {}

  onVerTodos(): void {
    this.searchText = '';
  }

  onNuevo(): void {
    this.router.navigate(['/dashboard/edit', 'componente', 0]);
  }

  onEdit(c: Componente): void {
    this.router.navigate(['/dashboard/edit', 'componente', c.codigo_componente]);
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
    this.selectedComponentForCart = c;
    this.cartQuantity = 1;
    this.isCartModalOpen = true;
  }

  closeCartModal(): void {
    this.isCartModalOpen = false;
    this.selectedComponentForCart = null;
  }

  confirmAddToCart(): void {
    if (this.selectedComponentForCart && this.cartQuantity > 0) {
      const item: CartItem = {
        componentId: this.selectedComponentForCart.codigo_componente,
        nombre: this.selectedComponentForCart.componente,
        equipo: this.selectedComponentForCart.equipo || 'N/A',
        cantidad: this.cartQuantity
      };
      this.cartService.addToCart(item);
      this.closeCartModal();
      // Notificación simple o feedback visual
    }
  }

  onVerPedido(): void {
    this.router.navigate(['/deposito/pedido']);
  }

  onProfileClick(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
