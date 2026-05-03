import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { DataService } from '../../../../core/services/data.service';
import { MantenimientoService } from '../../../../core/services/mantenimiento.service';
import { RepuestosService } from '../../../../core/services/repuestos.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { Mantenimiento } from '../../../../core/models/mantenimiento.model';
import { Repuesto } from '../../../../core/models/repuesto.model';
import { UserProfile } from '../../../../core/models/user.model';

@Component({
    selector: 'app-sala-gestion',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './sala-gestion.component.html',
    styleUrl: './sala-gestion.component.scss'
})
export class SalaGestionComponent implements OnInit {
    profile: UserProfile = { idusuario: 0, username: '', email: '' };
    mantenimientos: Mantenimiento[] = [];
    loading = false;
    searchText = '';
    searchBoletaText = '';
    activeFilter: 'activos' | 'inactivos' = 'activos';
    now: Date = new Date();
    salaName = '';
    
    // Modal state
    showModal = false;
    currentRecord: Mantenimiento = this.getEmptyRecord();

    // Budget Modal state
    showBudgetModal = false;
    budgetItems: any[] = [];
    availableRepuestos: Repuesto[] = [];
    searchRepuestoText = '';
    budgetTecnico = '';

    // Manual Repuesto state
    showManualForm = false;
    manualRepuesto: Repuesto = { nombre: '', descripcion: '', costo: 0 };

    // Finish Modal state
    showFinishModal = false;
    finishDesc = '';

    constructor(
        public auth: AuthService,
        private mantenimientoService: MantenimientoService,
        private dataService: DataService,
        private repuestosService: RepuestosService,
        private pdfService: PdfService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.salaName = this.route.snapshot.data['sala'] || 'SALA I';
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

        const isSuperAdmin = this.auth.isSuperAdmin();
        const isJefatura = this.auth.isJefatura();
        
        // El usuario solo puede entrar si es de esta sala exactamente, o es Jefatura/SuperAdmin
        const isUserOficina = oficina === this.salaName;

        if (!isUserOficina && !isJefatura && !isSuperAdmin) {
            alert(`Acceso denegado: Esta pantalla es exclusiva para ${this.salaName}.`);
            this.router.navigate(['/selector']);
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
            ubicacion: this.salaName || 'SALA I',
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
                // FILTRO: Solo equipos asignados a la sala correspondiente
                this.mantenimientos = data.filter(m => m.ubicacion === this.salaName);
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
        
        // Formatear fechas para que sean compatibles con <input type="date">
        if (this.currentRecord.fecha_entrada) {
            this.currentRecord.fecha_entrada = this.currentRecord.fecha_entrada.split('T')[0];
        }
        if (this.currentRecord.fecha_final && this.currentRecord.fecha_final !== '1000-01-01') {
            this.currentRecord.fecha_final = this.currentRecord.fecha_final.split('T')[0];
        }

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

    // --- LOGICA DE FINALIZACIÓN ---

    onFinish(item: Mantenimiento): void {
        this.currentRecord = { ...item };
        this.finishDesc = item.desc_final || '';
        this.showFinishModal = true;
    }

    closeFinishModal(): void {
        this.showFinishModal = false;
        this.finishDesc = '';
        this.currentRecord = this.getEmptyRecord();
    }

    confirmFinish(): void {
        if (!this.currentRecord.id_mantenimiento) return;
        if (!this.finishDesc) {
            alert('Por favor, ingresa una descripción del trabajo realizado.');
            return;
        }

        this.loading = true;
        const now = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD
        
        const updateData: Partial<Mantenimiento> = {
            desc_final: this.finishDesc,
            fecha_final: now,
            ubicacion: 'Rec. y Entrega',
            estado: 'Reparado' 
        };

        this.mantenimientoService.update(this.currentRecord.id_mantenimiento, updateData).subscribe({
            next: () => {
                this.loadData();
                this.closeFinishModal();
                this.loading = false;
                alert('Equipo finalizado y enviado a Rec. y Entrega.');
            },
            error: (err) => {
                console.error('Error al finalizar equipo:', err);
                this.loading = false;
                alert('Error al procesar la finalización del equipo.');
            }
        });
    }

    closeModal(): void {
        this.showModal = false;
        this.currentRecord = this.getEmptyRecord();
    }

    // --- LOGICA DE PRESUPUESTO ---

    onPresupuesto(item: Mantenimiento): void {
        this.currentRecord = { ...item };
        this.budgetTecnico = item.tecnico || this.profile.username;
        this.budgetItems = [];
        this.searchRepuestoText = '';
        this.loadRepuestos();
        
        // Cargar repuestos ya asociados si los hay
        if (item.id_mantenimiento) {
            this.mantenimientoService.getRepuestosByMantenimiento(item.id_mantenimiento).subscribe({
                next: (items) => {
                    this.budgetItems = items.map(i => ({
                        ...i,
                        costo_unitario: i.costo_unitario // Asegurar que usamos el costo guardado
                    }));
                },
                error: (err) => console.error('Error al cargar repuestos del presupuesto:', err)
            });
        }
        
        this.showBudgetModal = true;
    }

    closeBudgetModal(): void {
        this.showBudgetModal = false;
        this.budgetItems = [];
        this.availableRepuestos = [];
    }

    loadRepuestos(): void {
        this.repuestosService.getAll().subscribe({
            next: (data) => this.availableRepuestos = data,
            error: (err) => console.error('Error al cargar repuestos:', err)
        });
    }

    get filteredAvailableRepuestos(): Repuesto[] {
        if (!this.searchRepuestoText) return [];
        const search = this.searchRepuestoText.toLowerCase();
        return this.availableRepuestos.filter(r => 
            r.nombre.toLowerCase().includes(search) || 
            r.descripcion?.toLowerCase().includes(search)
        ).slice(0, 5); // Limitar sugerencias
    }

    addRepuestoToBudget(repuesto: Repuesto): void {
        const existing = this.budgetItems.find(i => i.id_repuesto === repuesto.idrepuestos);
        if (existing) {
            existing.cantidad++;
        } else {
            this.budgetItems.push({
                id_repuesto: repuesto.idrepuestos,
                nombre: repuesto.nombre,
                descripcion: repuesto.descripcion,
                cantidad: 1,
                costo_unitario: repuesto.costo
            });
        }
        this.searchRepuestoText = '';
    }

    removeRepuestoFromBudget(index: number): void {
        this.budgetItems.splice(index, 1);
    }

    toggleManualForm(): void {
        this.showManualForm = !this.showManualForm;
        this.manualRepuesto = { nombre: '', descripcion: '', costo: 0 };
    }

    saveManualRepuestoToBudget(): void {
        if (!this.manualRepuesto.nombre || this.manualRepuesto.costo <= 0) {
            alert('Por favor, completa el nombre y un costo válido para el repuesto.');
            return;
        }

        this.loading = true;
        // 1. Guardar en el catálogo general primero
        this.repuestosService.create(this.manualRepuesto).subscribe({
            next: (newRepuesto) => {
                // 2. Añadir al presupuesto actual
                // Dependiendo del backend, newRepuesto puede ser el objeto o tener el insertId
                const repuestoToAdd: Repuesto = {
                    ...this.manualRepuesto,
                    idrepuestos: newRepuesto.idrepuestos || newRepuesto.id || newRepuesto.insertId
                };
                
                this.addRepuestoToBudget(repuestoToAdd);
                this.toggleManualForm();
                this.loading = false;
                alert('Repuesto creado y añadido al presupuesto.');
            },
            error: (err) => {
                console.error('Error al crear repuesto manual:', err);
                this.loading = false;
                alert('Error al guardar el nuevo repuesto en el catálogo.');
            }
        });
    }

    get budgetTotal(): number {
        return this.budgetItems.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
    }

    confirmBudget(): void {
        if (!this.currentRecord.id_mantenimiento) return;
        if (!this.budgetTecnico) {
            alert('Por favor, ingresa el nombre del técnico.');
            return;
        }

        this.loading = true;
        
        this.mantenimientoService.saveRepuestosMantenimiento(
            this.currentRecord.id_mantenimiento, 
            this.budgetItems, 
            this.budgetTecnico, 
            this.budgetTotal
        ).subscribe({
            next: () => {
                this.pdfService.generatePresupuestoPDF(this.currentRecord, this.budgetItems, this.budgetTecnico);
                this.loadData();
                this.closeBudgetModal();
                this.loading = false;
                alert('Presupuesto confirmado y PDF generado.');
            },
            error: (err) => {
                console.error('Error al guardar presupuesto:', err);
                this.loading = false;
                alert('Error al guardar el presupuesto.');
            }
        });
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
