import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { Mantenimiento } from '../../core/models/mantenimiento.model';
import { UserProfile } from '../../core/models/user.model';
import { Unidad } from '../../core/models/data.model';

@Component({
    selector: 'app-mantenimiento',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './mantenimiento.component.html',
    styleUrl: './mantenimiento.component.scss'
})
export class MantenimientoComponent implements OnInit {
    profile: UserProfile = { idusuario: 0, username: '', email: '' };
    mantenimientos: Mantenimiento[] = [];
    loading = false;
    searchText = '';
    
    // Modal state
    showModal = false;
    isEditing = false;
    currentRecord: Mantenimiento = this.getEmptyRecord();

    // Autocomplete for Procedencia (Unidades)
    unidades: Unidad[] = [];
    filteredUnidades: Unidad[] = [];
    showSuggestions = false;
    loadingUnidades = false;

    constructor(
        public auth: AuthService,
        private mantenimientoService: MantenimientoService,
        private dataService: DataService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProfileAndCheckAccess();
        this.loadData();
        this.loadUnidades();
    }

    loadUnidades(): void {
        this.loadingUnidades = true;
        this.dataService.getUnidades().subscribe({
            next: (data) => { 
                console.log('Unidades cargadas:', data);
                this.unidades = data; 
                this.loadingUnidades = false;
            },
            error: (err) => {
                console.error('Error al cargar unidades:', err);
                this.loadingUnidades = false;
            }
        });
    }

    onProcedenciaInput(): void {
        const val = this.currentRecord.procedencia?.toLowerCase() || '';
        if (val.length < 1) {
            this.filteredUnidades = [];
            this.showSuggestions = false;
            return;
        }

        this.filteredUnidades = this.unidades.filter(u => 
            u.nombre_de_la_unidad?.toLowerCase().includes(val) || 
            u.unidad?.toLowerCase().includes(val)
        ).slice(0, 8);

        this.showSuggestions = this.filteredUnidades.length > 0;
    }

    onProcedenciaBlur(): void {
        // Delay hiding suggestions to allow mousedown to trigger on the list
        setTimeout(() => {
            this.showSuggestions = false;
        }, 200);
    }

    selectUnidad(u: Unidad): void {
        this.currentRecord.procedencia = u.nombre_de_la_unidad;
        this.showSuggestions = false;
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

        const allowedOffices = [
            'Jefe', '2do Jefe', 'Cte. de Ca.', 'Jefe de Secc. Mant.',
            'Sala I', 'Sala II', 'Sala III', 'Sala IV', 'Sala V', 'RyE'
        ];
        
        const isAdmin = this.auth.isAdmin() || this.auth.isSuperAdmin();
        const hasAccess = allowedOffices.some(off => oficina.includes(off)) || isAdmin;

        if (!hasAccess) {
            alert('Acceso denegado: Tu oficina no tiene permisos para este módulo.');
            this.router.navigate(['/dashboard']);
        }
    }

    get canCreate(): boolean {
        const creatorOffices = ['Cte. de Ca.', 'Jefe de Secc. Mant.', 'RyE'];
        const oficina = this.profile.oficina || '';
        const isAdmin = this.auth.isAdmin() || this.auth.isSuperAdmin();
        return creatorOffices.some(off => oficina.includes(off)) || isAdmin;
    }

    getEmptyRecord(): Mantenimiento {
        return {
            fecha_entrada: new Date().toISOString().split('T')[0],
            equipo: '',
            marca: '',
            nro_serie: '',
            procedencia: '',
            entrega: '',
            recibe: '',
            tel_contacto: 0,
            calidad: 'Estándar',
            ubicacion: '',
            estado: 'Pendiente',
            presupuesto: 'S/D',
            tecnico: '',
            desc_final: '',
            fecha_final: ''
        };
    }

    loadData(): void {
        this.loading = true;
        this.mantenimientoService.getAll().subscribe({
            next: (data) => {
                this.mantenimientos = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error al cargar mantenimientos:', err);
                this.loading = false;
            }
        });
    }

    get filteredMantenimientos(): Mantenimiento[] {
        if (!this.searchText) return this.mantenimientos;
        const search = this.searchText.toLowerCase();
        return this.mantenimientos.filter(m =>
            m.equipo.toLowerCase().includes(search) ||
            m.procedencia.toLowerCase().includes(search) ||
            m.ubicacion.toLowerCase().includes(search) ||
            m.id_mantenimiento?.toString().includes(search)
        );
    }

    onNuevo(): void {
        if (!this.canCreate) {
            alert('No tienes permisos para crear registros de mantenimiento.');
            return;
        }
        this.isEditing = false;
        this.currentRecord = this.getEmptyRecord();
        this.showModal = true;
    }

    onEdit(item: Mantenimiento): void {
        this.isEditing = true;
        this.currentRecord = { ...item };
        this.showModal = true;
    }

    saveRecord(): void {
        if (!this.currentRecord.equipo || !this.currentRecord.nro_serie) {
            alert('Por favor, completa los campos obligatorios (Equipo y Nro Serie).');
            return;
        }

        this.loading = true;
        const obs$ = this.isEditing 
            ? this.mantenimientoService.update(this.currentRecord.id_mantenimiento!, this.currentRecord)
            : this.mantenimientoService.create(this.currentRecord);

        obs$.subscribe({
            next: () => {
                this.loadData();
                this.closeModal();
                alert(this.isEditing ? 'Registro actualizado con éxito.' : 'Registro creado con éxito.');
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                this.loading = false;
                alert('Ocurrió un error al guardar el registro.');
            }
        });
    }

    closeModal(): void {
        this.showModal = false;
        this.currentRecord = this.getEmptyRecord();
    }

    onDelete(id: number): void {
        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            this.mantenimientoService.delete(id).subscribe({
                next: () => {
                    this.loadData();
                    alert('Registro eliminado.');
                },
                error: (err) => alert('Error al eliminar registro.')
            });
        }
    }

    onProfileClick(): void {
        this.router.navigate(['/dashboard/profile']);
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
