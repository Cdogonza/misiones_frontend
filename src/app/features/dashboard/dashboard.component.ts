import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { PdfService } from '../../core/services/pdf.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { Equipo, Componente, Unidad, UnidadAgrupada } from '../../core/models/data.model';
import { UserProfile } from '../../core/models/user.model';

type DashboardView = 'informe' | 'componentes' | 'equipos' | 'unidades';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    profile: UserProfile = { idusuario: 0, username: '', email: '' };
    loading = false;

    constructor(
        public auth: AuthService,
        private dataService: DataService,
        private pdfService: PdfService,
        private router: Router,
        private stateService: DashboardStateService
    ) { }

    // ── Proxies al estado persistente ──────────────────────────────────────

    get activeView(): DashboardView { return this.stateService.getState().activeView; }
    set activeView(v: DashboardView) { this.stateService.patch({ activeView: v }); }

    get searchText(): string { return this.stateService.getState().searchText; }
    set searchText(v: string) { this.stateService.patch({ searchText: v }); }

    get selectedUnidad(): Unidad | null { return this.stateService.getState().selectedUnidad; }
    set selectedUnidad(v: Unidad | null) { this.stateService.patch({ selectedUnidad: v }); }

    get unidadAgrupada(): UnidadAgrupada | null { return this.stateService.getState().unidadAgrupada; }
    set unidadAgrupada(v: UnidadAgrupada | null) { this.stateService.patch({ unidadAgrupada: v }); }

    get reportSearchText(): string { return this.stateService.getState().reportSearchText; }
    set reportSearchText(v: string) { this.stateService.patch({ reportSearchText: v }); }

    get equipos(): Equipo[] { return this.stateService.getState().equipos; }
    set equipos(v: Equipo[]) { this.stateService.patch({ equipos: v }); }

    get componentes(): Componente[] { return this.stateService.getState().componentes; }
    set componentes(v: Componente[]) { this.stateService.patch({ componentes: v }); }

    get unidades(): Unidad[] { return this.stateService.getState().unidades; }
    set unidades(v: Unidad[]) { this.stateService.patch({ unidades: v }); }

    get showTable(): { [key in DashboardView]: boolean } { return this.stateService.getState().showTable; }
    set showTable(v: { [key in DashboardView]: boolean }) { this.stateService.patch({ showTable: v }); }

    get viewSearchText(): { [key in DashboardView]: string } { return this.stateService.getState().viewSearchText; }
    set viewSearchText(v: { [key in DashboardView]: string }) { this.stateService.patch({ viewSearchText: v }); }

    // ── Ciclo de vida ──────────────────────────────────────────────────────

    ngOnInit(): void {
        // Redirección si la oficina es deposito
        const oficina = this.auth.getUserOficina();
        if (oficina?.toLowerCase().includes('deposito')) {
            this.router.navigate(['/deposito']);
            return;
        }

        this.loadProfile();
        // Si no había unidades cargadas, las traemos (para el buscador de informe)
        if (this.unidades.length === 0) {
            this.loadUnidadesParaInforme();
        }
        // Si había una vista de tabla visible, refrescamos los datos
        if (this.showTable[this.activeView] && this.activeView !== 'informe') {
            this.loadData();
        }
    }

    loadProfile(): void {
        this.auth.getProfile().subscribe({
            next: (data) => { this.profile = data; },
            error: () => { alert('Error al cargar perfil.'); }
        });
    }

    // ── Informe ────────────────────────────────────────────────────────────

    get filteredUnidades(): Unidad[] {
        if (!this.searchText) return this.unidades;
        const search = this.searchText.toLowerCase();
        return this.unidades.filter(u =>
            (u.unidad?.toLowerCase()?.includes(search) || false) ||
            (u.nombre_de_la_unidad?.toLowerCase()?.includes(search) || false)
        );
    }

    loadUnidadesParaInforme(): void {
        this.dataService.getUnidades().subscribe(data => this.unidades = data);
    }

    selectUnidad(unidad: Unidad): void {
        this.selectedUnidad = unidad;
        this.searchText = unidad.nombre_de_la_unidad;
        this.loading = true;
        this.dataService.getUnidadAgrupada(unidad.codigo_unidad).subscribe({
            next: (data) => {
                this.unidadAgrupada = data;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    get filteredReportData(): any[] {
        if (!this.unidadAgrupada) return [];
        if (!this.reportSearchText) return this.unidadAgrupada.equipos;

        const search = this.reportSearchText.toLowerCase();

        return this.unidadAgrupada.equipos
            .map(eq => {
                const matchEquipo = eq.equipo?.toLowerCase()?.includes(search);
                const filteredComps = eq.componentes.filter(c =>
                    c.componente?.toLowerCase()?.includes(search) ||
                    c.serie?.toLowerCase()?.includes(search)
                );
                if (matchEquipo || filteredComps.length > 0) {
                    return { ...eq, componentes: matchEquipo ? eq.componentes : filteredComps };
                }
                return null;
            })
            .filter(eq => eq !== null);
    }

    onVerDatosCompletos(): void {
        if (this.selectedUnidad) {
            this.router.navigate(['/dashboard/full-data', this.selectedUnidad.codigo_unidad]);
        }
    }

    downloadPdf(): void {
        if (this.unidadAgrupada) {
            this.pdfService.exportUnidadAgrupada(this.unidadAgrupada);
        }
    }

    clearSearch(): void {
        this.stateService.patch({
            searchText: '',
            reportSearchText: '',
            selectedUnidad: null,
            unidadAgrupada: null
        });
        this.loadUnidadesParaInforme();
    }

    // ── Navegación de vistas ───────────────────────────────────────────────

    switchView(view: DashboardView): void {
        this.activeView = view;
        if (view === 'informe' && this.unidades.length === 0) {
            this.loadUnidadesParaInforme();
        }
    }

    onVerTodos(): void {
        const updatedShowTable = { ...this.showTable, [this.activeView]: true };
        this.stateService.patch({ showTable: updatedShowTable });
        this.loadData();
    }

    onNuevo(): void {
        const type = this.activeView === 'unidades' ? 'unidad' : (this.activeView === 'equipos' ? 'equipo' : 'componente');
        this.router.navigate(['/dashboard/edit', type, 0]);
    }

    onProfileClick(): void {
        this.router.navigate(['/dashboard/profile']);
    }

    onSearch(): void {
        const updatedShowTable = { ...this.showTable, [this.activeView]: true };
        this.stateService.patch({ showTable: updatedShowTable });
        this.loadData();
    }

    // ── Datos filtrados ────────────────────────────────────────────────────

    get filteredData(): any[] {
        const search = this.viewSearchText[this.activeView].toLowerCase();
        if (this.activeView === 'componentes') {
            if (!search) return this.componentes;
            return this.componentes.filter(c =>
                c.componente?.toLowerCase().includes(search) ||
                c.serie?.toLowerCase().includes(search)
            );
        } else if (this.activeView === 'equipos') {
            if (!search) return this.equipos;
            return this.equipos.filter(e => e.equipo?.toLowerCase().includes(search));
        } else if (this.activeView === 'unidades') {
            if (!search) return this.unidades;
            return this.unidades.filter(u =>
                u.unidad?.toLowerCase().includes(search) ||
                u.nombre_de_la_unidad?.toLowerCase().includes(search)
            );
        }
        return [];
    }

    loadData(): void {
        this.loading = true;
        switch (this.activeView) {
            case 'equipos':
                this.dataService.getEquipos().subscribe({
                    next: (data) => { this.equipos = data; this.loading = false; },
                    error: () => this.loading = false
                });
                break;
            case 'componentes':
                this.dataService.getComponentes().subscribe({
                    next: (data) => { this.componentes = data; this.loading = false; },
                    error: () => this.loading = false
                });
                break;
            case 'unidades':
                this.dataService.getUnidades().subscribe({
                    next: (data) => { this.unidades = data; this.loading = false; },
                    error: () => this.loading = false
                });
                break;
            case 'informe':
                this.loading = false;
                break;
        }
    }

    // ── Acciones CRUD ──────────────────────────────────────────────────────

    onEdit(item: any, view?: DashboardView): void {
        let entityType: string;
        if (view) {
            entityType = view === 'componentes' ? 'componente' : (view === 'equipos' ? 'equipo' : 'unidad');
        } else {
            entityType = item.codigo_componente ? 'componente' : (item.codigo_equipo ? 'equipo' : 'unidad');
        }
        const id = item.codigo_componente || item.codigo_equipo || item.codigo_unidad;
        this.router.navigate(['/dashboard/edit', entityType, id]);
    }

    onDelete(view: DashboardView, id: number): void {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

        this.loading = true;
        let obs$;
        if (view === 'equipos') obs$ = this.dataService.deleteEquipo(id);
        else if (view === 'componentes') obs$ = this.dataService.deleteComponente(id);
        else obs$ = this.dataService.deleteUnidad(id);

        obs$.subscribe({
            next: () => {
                const details = `Eliminó ${view.slice(0, -1)} ID: ${id}`;
                this.logHistory('DELETE', view.slice(0, -1) as any, id, details);
            },
            error: (err) => {
                this.loading = false;
                alert('Error al eliminar: ' + (err.error?.message || 'Conflicto de integridad'));
            }
        });
    }

    logHistory(accion: 'EDIT' | 'DELETE', tipo_entidad: any, id_entidad: number, detalles: string): void {
        const user = this.auth.getUserName() || 'Admin';
        const registro = { accion, tipo_entidad, id_entidad, usuario: user, detalles };

        this.dataService.addHistorial(registro).subscribe({
            next: () => {
                this.loadData();
                if (this.selectedUnidad) {
                    this.selectUnidad(this.selectedUnidad);
                }
                alert('Registro eliminado y acción registrada.');
            },
            error: (err) => {
                console.error('Error en historial:', err);
                this.loadData();
                if (err.status >= 200 && err.status < 300) {
                    if (this.selectedUnidad) this.selectUnidad(this.selectedUnidad);
                    alert('Registro eliminado y acción registrada.');
                } else {
                    alert('Registro eliminado, pero falló el registro en historial (Servidor).');
                }
            }
        });
    }

    logout(): void {
        this.stateService.reset();
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
