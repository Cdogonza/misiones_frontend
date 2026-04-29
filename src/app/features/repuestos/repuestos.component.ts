import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RepuestosService } from '../../core/services/repuestos.service';
import { Repuesto } from '../../core/models/repuesto.model';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-repuestos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repuestos.component.html',
  styleUrl: './repuestos.component.scss'
})
export class RepuestosComponent implements OnInit {
  profile: UserProfile = { idusuario: 0, username: '', email: '' };
  repuestos: Repuesto[] = [];
  loading = false;
  searchText = '';
  
  // Modal state
  showModal = false;
  isEditing = false;
  currentRepuesto: Repuesto = this.getEmptyRepuesto();

  constructor(
    public auth: AuthService,
    private repuestosService: RepuestosService,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loadProfile();
    this.loadData();
  }

  loadProfile(): void {
    this.auth.getProfile().subscribe({
      next: (data) => this.profile = data,
      error: () => this.router.navigate(['/login'])
    });
  }

  loadData(): void {
    this.loading = true;
    this.repuestosService.getAll().subscribe({
      next: (data) => {
        this.repuestos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading repuestos:', err);
        this.loading = false;
      }
    });
  }

  get filteredRepuestos(): Repuesto[] {
    if (!this.searchText) return this.repuestos;
    const search = this.searchText.toLowerCase();
    return this.repuestos.filter(r => 
      r.nombre.toLowerCase().includes(search) || 
      r.descripcion.toLowerCase().includes(search)
    );
  }

  getEmptyRepuesto(): Repuesto {
    return {
      nombre: '',
      descripcion: '',
      costo: 0
    };
  }

  onNuevo(): void {
    this.isEditing = false;
    this.currentRepuesto = this.getEmptyRepuesto();
    this.showModal = true;
  }

  onEdit(repuesto: Repuesto): void {
    this.isEditing = true;
    this.currentRepuesto = { ...repuesto };
    this.showModal = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar este repuesto?')) {
      this.repuestosService.delete(id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Error al eliminar repuesto')
      });
    }
  }

  saveRepuesto(): void {
    if (!this.currentRepuesto.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    this.loading = true;
    if (this.isEditing && this.currentRepuesto.idrepuestos) {
      this.repuestosService.update(this.currentRepuesto.idrepuestos, this.currentRepuesto).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: () => {
          this.loading = false;
          alert('Error al actualizar');
        }
      });
    } else {
      this.repuestosService.create(this.currentRepuesto).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: () => {
          this.loading = false;
          alert('Error al crear');
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.currentRepuesto = this.getEmptyRepuesto();
  }

  goBack(): void {
    this.location.back();
  }

  goToSelector(): void {
    this.router.navigate(['/selector']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  onProfileClick(): void {
    this.router.navigate(['/dashboard/profile']);
  }
}
