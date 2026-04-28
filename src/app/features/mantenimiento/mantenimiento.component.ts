import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { PdfService } from '../../core/services/pdf.service';
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
    searchBoletaText = '';
    activeFilter: 'activos' | 'inactivos' = 'activos';
    
    // Modal state
    showModal = false;
    isEditing = false;
    currentRecord: Mantenimiento = this.getEmptyRecord();
    pendingRecords: Mantenimiento[] = [];
    
    // Deliver modal state
    showDeliverModal = false;
    recordToDeliver: Mantenimiento | null = null;
    newLocation = 'SALA I';

    // Return (Devolución) modal state
    showDevolucionModal = false;
    boletaToReturn = '';
    equiposParaDevolucion: Mantenimiento[] = [];
    equiposSeleccionados: Set<number> = new Set();

    // Autocomplete for Procedencia (Unidades)
    unidades: Unidad[] = [];
    filteredUnidades: Unidad[] = [];
    showSuggestions = false;
    loadingUnidades = false;

    constructor(
        public auth: AuthService,
        private mantenimientoService: MantenimientoService,
        private dataService: DataService,
        private pdfService: PdfService,
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
            'Sala I', 'Sala II', 'Sala III', 'Sala IV', 'Sala V', 'Rec. y Entrega'
        ];
        
        const isAdmin = this.auth.isAdmin() || this.auth.isSuperAdmin();
        const hasAccess = allowedOffices.some(off => oficina.includes(off)) || isAdmin;

        if (!hasAccess) {
            alert('Acceso denegado: Tu oficina no tiene permisos para este módulo.');
            this.router.navigate(['/dashboard']);
        }
    }

    get canCreate(): boolean {
        const creatorOffices = ['Cte. de Ca.', 'Jefe de Secc. Mant.', 'Rec. y Entrega'];
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
            tel_contacto: '',
            calidad: 'Estándar',
            ubicacion: 'Rec. y Entrega',
            estado: 'Pendiente',
            presupuesto: 'S/D',
            tecnico: '',
            desc_final: '',
            fecha_final: '1000-01-01'
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
                m.ubicacion.toLowerCase().includes(search) ||
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

    onNuevo(): void {
        if (!this.canCreate) {
            alert('No tienes permisos para crear registros de mantenimiento.');
            return;
        }
        this.isEditing = false;
        this.currentRecord = this.getEmptyRecord();
        this.pendingRecords = [];
        this.showModal = true;
    }

    onEdit(item: Mantenimiento): void {
        this.isEditing = true;
        this.currentRecord = { ...item };
        this.showModal = true;
    }

    addAnotherRecord(): void {
        if (!this.currentRecord.equipo || !this.currentRecord.nro_serie) {
            alert('Por favor, completa los campos obligatorios (Equipo y Nro Serie) antes de agregar otro.');
            return;
        }
        this.pendingRecords.push({ ...this.currentRecord });
        
        // Mantener datos comunes para el siguiente registro
        const nextRecord = this.getEmptyRecord();
        nextRecord.procedencia = this.currentRecord.procedencia;
        nextRecord.entrega = this.currentRecord.entrega;
        nextRecord.recibe = this.currentRecord.recibe;
        nextRecord.tel_contacto = this.currentRecord.tel_contacto;
        nextRecord.fecha_entrada = this.currentRecord.fecha_entrada;
        
        this.currentRecord = nextRecord;
    }

    saveRecord(): void {
        if (this.currentRecord.equipo || this.currentRecord.nro_serie) {
            if (!this.currentRecord.equipo || !this.currentRecord.nro_serie) {
                alert('Por favor, completa los campos obligatorios (Equipo y Nro Serie) del registro actual.');
                return;
            }
            this.pendingRecords.push({ ...this.currentRecord });
            this.currentRecord = this.getEmptyRecord(); // Limpiar por si acaso
        }

        if (this.pendingRecords.length === 0) {
            alert('No hay registros para guardar.');
            return;
        }

        this.loading = true;

        if (this.isEditing) {
            // Solo debe haber un registro al editar
            const recordToUpdate = this.pendingRecords[0];
            this.mantenimientoService.update(recordToUpdate.id_mantenimiento!, recordToUpdate).subscribe({
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
        } else {
            // Creación múltiple
            // Generar un id_boleta único para este lote (ej: BOL-YYYYMMDD-XXXX)
            const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const generatedBoletaId = `BOL-${dateStr}-${randomCode}`;

            const createObservables = this.pendingRecords.map(record => {
                const recordWithBoleta = { ...record, id_boleta: generatedBoletaId };
                return this.mantenimientoService.create(recordWithBoleta);
            });
            
            forkJoin(createObservables).subscribe({
                next: (results: any[]) => {
                    // Mezclar los datos de pendingRecords con los IDs devueltos por el backend
                    const recordsWithIds = this.pendingRecords.map((record, i) => {
                        return {
                            ...record,
                            id_boleta: generatedBoletaId,
                            id_mantenimiento: results[i]?.id_mantenimiento || results[i]?.insertId || results[i]?.id || 'N/A'
                        };
                    });

                    // Generar PDF con los registros creados (incluyendo el ID)
                    this.pdfService.generateMantenimientoBoletaPDF(recordsWithIds);
                    
                    this.loadData();
                    this.closeModal();
                    alert('Registros creados y boleta generada con éxito.');
                },
                error: (err) => {
                    console.error('Error al crear registros:', err);
                    this.loading = false;
                    alert('Ocurrió un error al guardar los registros.');
                }
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.currentRecord = this.getEmptyRecord();
        this.pendingRecords = [];
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

    onDeliver(item: Mantenimiento): void {
        this.recordToDeliver = { ...item };
        this.newLocation = 'SALA I';
        this.showDeliverModal = true;
    }

    closeDeliverModal(): void {
        this.showDeliverModal = false;
        this.recordToDeliver = null;
    }

    confirmDeliver(): void {
        if (!this.recordToDeliver || !this.recordToDeliver.id_mantenimiento) return;

        this.loading = true;
        const updatedRecord = { ...this.recordToDeliver, ubicacion: this.newLocation };
        
        this.mantenimientoService.update(updatedRecord.id_mantenimiento!, updatedRecord).subscribe({
            next: () => {
                this.loadData();
                this.closeDeliverModal();
                alert(`Equipo entregado a ${this.newLocation} con éxito.`);
            },
            error: (err) => {
                console.error('Error al entregar equipo:', err);
                this.loading = false;
                alert('Error al actualizar la ubicación.');
            }
        });
    }

    // --- LOGICA DE DEVOLUCION ---

    abrirModalDevolucion(boletaId: string | undefined): void {
        if (!boletaId) return;
        this.boletaToReturn = boletaId;
        // Filtrar todos los equipos de esta boleta que estén PENDIENTES
        this.equiposParaDevolucion = this.mantenimientos.filter(
            m => m.id_boleta === boletaId && m.estado !== 'DEVUELTO'
        );
        
        if (this.equiposParaDevolucion.length === 0) {
            alert('Todos los equipos de esta boleta ya han sido devueltos.');
            return;
        }
        
        this.equiposSeleccionados.clear();
        this.showDevolucionModal = true;
    }

    closeDevolucionModal(): void {
        this.showDevolucionModal = false;
        this.equiposParaDevolucion = [];
        this.equiposSeleccionados.clear();
        this.boletaToReturn = '';
    }

    toggleDevolucionSelection(id: number | undefined): void {
        if (id === undefined) return;
        if (this.equiposSeleccionados.has(id)) {
            this.equiposSeleccionados.delete(id);
        } else {
            this.equiposSeleccionados.add(id);
        }
    }

    toggleAllDevolucion(): void {
        if (this.isAllDevolucionSelected()) {
            this.equiposSeleccionados.clear();
        } else {
            this.equiposParaDevolucion.forEach(eq => {
                if (eq.id_mantenimiento !== undefined) {
                    this.equiposSeleccionados.add(eq.id_mantenimiento);
                }
            });
        }
    }

    isAllDevolucionSelected(): boolean {
        return this.equiposParaDevolucion.length > 0 && 
               this.equiposSeleccionados.size === this.equiposParaDevolucion.length;
    }

    confirmarDevolucion(): void {
        if (this.equiposSeleccionados.size === 0) {
            alert('Por favor, selecciona al menos un equipo para devolver.');
            return;
        }

        this.loading = true;
        const equiposAActualizar = this.equiposParaDevolucion.filter(eq => 
            eq.id_mantenimiento !== undefined && this.equiposSeleccionados.has(eq.id_mantenimiento)
        );

        const todayDateStr = new Date().toISOString().split('T')[0];

        const updateObservables = equiposAActualizar.map(eq => {
            const dataToUpdate = { ...eq, estado: 'DEVUELTO', fecha_final: todayDateStr };
            return this.mantenimientoService.update(eq.id_mantenimiento!, dataToUpdate);
        });

        forkJoin(updateObservables).subscribe({
            next: () => {
                // Modificar el estado local para el PDF
                const equiposGenerados = equiposAActualizar.map(eq => ({ 
                    ...eq, 
                    estado: 'DEVUELTO', 
                    fecha_final: todayDateStr 
                }));
                
                this.pdfService.generateMantenimientoDevolucionPDF(equiposGenerados, this.boletaToReturn);
                this.loadData();
                this.closeDevolucionModal();
                alert('Equipos devueltos y boleta de devolución generada con éxito.');
            },
            error: (err) => {
                console.error('Error al procesar la devolución:', err);
                this.loading = false;
                alert('Ocurrió un error al procesar la devolución.');
            }
        });
    }

    redescargarBoletaDevolucion(boletaId: string): void {
        const equipos = this.mantenimientos.filter(m => m.id_boleta === boletaId && m.estado === 'DEVUELTO');
        if (equipos.length > 0) {
            this.pdfService.generateMantenimientoDevolucionPDF(equipos, boletaId);
        }
    }

    onProfileClick(): void {
        this.router.navigate(['/dashboard/profile']);
    }

    goToSelector(): void {
        this.router.navigate(['/selector']);
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
