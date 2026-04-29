import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { DataService } from '../../../../core/services/data.service';
import { MantenimientoService } from '../../../../core/services/mantenimiento.service';
import { Mantenimiento } from '../../../../core/models/mantenimiento.model';
import { UserProfile } from '../../../../core/models/user.model';

@Component({
    selector: 'app-sala-i',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './sala-i.component.html',
    styleUrl: './sala-i.component.scss'
})
export class SalaIComponent implements OnInit {
    profile: UserProfile = { idusuario: 0, username: '', email: '' };
    mantenimientos: Mantenimiento[] = [];
    loading = false;
    searchText = '';
    searchBoletaText = '';
    activeFilter: 'activos' | 'inactivos' = 'activos';
    
    // Modal state
    showModal = false;
    currentRecord: Mantenimiento = this.getEmptyRecord();

    constructor(
        public auth: AuthService,
        private mantenimientoService: MantenimientoService,
        private dataService: DataService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProfileAndCheckAccess();
        this.loadData();
    }

    loadProfileAndCheckAccess(): void {
        this.auth.getProfile().subscribe({
            next: (data) => {
                this.profile = data;
                this.validateOffice(data.oficina);
            },
            error: () => { 
                console.error('Error al cargar perfil.');
                this.router.navigate(['/login']);
            }
        });
    }

    validateOffice(oficina?: string): void {
        if (!oficina) {
            this.router.navigate(['/dashboard']);
            return;
        }

        const isAdmin = this.auth.isAdmin() || this.auth.isSuperAdmin();
        const isJefatura = this.auth.isJefatura();
        const isSalaI = oficina.includes('Sala I');

        if (!isSalaI && !isJefatura && !isAdmin) {
            alert('Acceso denegado: Esta pantalla es exclusiva para SALA I.');
            this.router.navigate(['/dashboard']);
        }
    }

    getEmptyRecord(): Mantenimiento {
        return {
            fecha_entrada: '',
            equipo: '',
            marca: '',
            nro_serie: '',
            procedencia: '',
            entrega: '',
            recibe: '',
            tel_contacto: '',
            calidad: '',
            ubicacion: 'SALA I',
            estado: 'Pendiente',
            presupuesto: '',
            tecnico: '',
            desc_final: '',
            fecha_final: '1000-01-01'
        };
    }

    loadData(): void {
        this.loading = true;
        this.mantenimientoService.getAll().subscribe({
            next: (data) => {
                // FILTRO: Solo equipos asignados a SALA I
                this.mantenimientos = data.filter(m => m.ubicacion === 'SALA I');
                this.loading = false;
            },
            error: (err) => {
                console.error('Error al cargar mantenimientos:', err);
                this.loading = false;
            }
        });
    }

    get filteredMantenimientos(): Mantenimiento[] {
        let result = this.mantenimientos;
        
        // 1. Filtrar por estado
        if (this.activeFilter === 'activos') {
            result = result.filter(m => m.estado !== 'DEVUELTO');
        } else {
            result = result.filter(m => m.estado === 'DEVUELTO');
        }

        // 2. Filtrar por texto
        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            result = result.filter(m =>
                m.equipo.toLowerCase().includes(search) ||
                m.procedencia.toLowerCase().includes(search) ||
                m.nro_serie.toLowerCase().includes(search) ||
                m.id_mantenimiento?.toString().includes(search)
            );
        }
        
        // 3. Filtrar por boleta
        if (this.searchBoletaText) {
            const searchBoleta = this.searchBoletaText.toLowerCase();
            result = result.filter(m => 
                m.id_boleta?.toLowerCase().includes(searchBoleta)
            );
        }
        
        return result;
    }

    applyFilter(filter?: 'activos' | 'inactivos'): void {
        if (filter) {
            this.activeFilter = filter;
        }
    }

    countByFilter(type: 'activos' | 'inactivos'): number {
        if (type === 'activos') {
            return this.mantenimientos.filter(m => m.estado !== 'DEVUELTO').length;
        } else {
            return this.mantenimientos.filter(m => m.estado === 'DEVUELTO').length;
        }
    }

    onEdit(item: Mantenimiento): void {
        this.currentRecord = { ...item };
        this.showModal = true;
    }

    saveRecord(): void {
        if (!this.currentRecord.id_mantenimiento) return;

        this.loading = true;
        this.mantenimientoService.update(this.currentRecord.id_mantenimiento, this.currentRecord).subscribe({
            next: () => {
                this.loadData();
                this.closeModal();
                alert('Registro actualizado con éxito.');
            },
            error: (err) => {
                console.error('Error al actualizar:', err);
                this.loading = false;
                alert('Ocurrió un error al actualizar el registro.');
            }
        });
    }

    closeModal(): void {
        this.showModal = false;
        this.currentRecord = this.getEmptyRecord();
    }

    onProfileClick(): void {
        this.router.navigate(['/dashboard/profile']);
    }

    goToSelector(): void {
        this.router.navigate(['/selector']);
    }

    goToRepuestos(): void {
        this.router.navigate(['/repuestos']);
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
