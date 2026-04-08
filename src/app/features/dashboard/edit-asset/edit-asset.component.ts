import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { Equipo, Componente, Unidad } from '../../../core/models/data.model';

@Component({
    selector: 'app-edit-asset',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-asset.component.html',
    styleUrl: './edit-asset.component.scss'
})
export class EditAssetComponent implements OnInit {
    type: 'equipo' | 'componente' | 'unidad' = 'componente';
    id: number = 0;
    loading = true;
    saving = false;

    // Data models
    equipo: Partial<Equipo> = {};
    componente: Partial<Componente> = {};
    unidad: Partial<Unidad> = {};

    // Lists for dropdowns
    unidades: Unidad[] = [];
    equipos: Equipo[] = [];
    existingComponentNames: string[] = [];
    filteredNames: string[] = [];
    existingEquipoNames: string[] = [];
    filteredEquipoNames: string[] = [];

    // Ámbito autocomplete
    existingAmbitos: string[] = [];
    filteredAmbitos: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: DataService,
        private auth: AuthService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.type = params['type'] as any;
            this.id = +params['id'];
            if (this.id === 0) {
                this.initNew();
            } else {
                this.loadData();
            }

            if (this.type === 'componente' || this.type === 'equipo') {
                this.loadAssociations();
            }
            if (this.type === 'unidad') {
                this.loadAmbitos();
            }
        });
    }

    initNew(): void {
        this.loading = false;
        this.equipo = {};
        this.componente = { estado: 'Bueno' };
        this.unidad = {};
    }

    loadAssociations(): void {
        this.dataService.getUnidades().subscribe(data => this.unidades = data);
        
        this.dataService.getEquipos().subscribe(data => {
            this.equipos = data;
            // Extraer nombres únicos de equipos para el autocompletado
            const names = data.map(e => e.equipo).filter(n => !!n);
            this.existingEquipoNames = Array.from(new Set(names));
        });
        
        // Cargar nombres de componentes existentes para el autocompletado
        this.dataService.getComponentes().subscribe(data => {
            // Extraer nombres únicos
            const names = data.map(c => c.componente).filter(n => !!n);
            this.existingComponentNames = Array.from(new Set(names));
        });
    }

    loadAmbitos(): void {
        this.dataService.getUnidades().subscribe(data => {
            const ambitos = data.map(u => u.ambito).filter(a => !!a) as string[];
            this.existingAmbitos = Array.from(new Set(ambitos));
        });
    }

    onAmbitoInput(): void {
        const val = this.unidad.ambito || '';
        if (val.length < 1) {
            this.filteredAmbitos = [];
            return;
        }
        const search = val.toLowerCase();
        this.filteredAmbitos = this.existingAmbitos
            .filter(a => a.toLowerCase().includes(search))
            .filter(a => a.toLowerCase() !== search)
            .slice(0, 5);
    }

    selectAmbito(ambito: string): void {
        this.unidad.ambito = ambito;
        this.filteredAmbitos = [];
    }

    onEquipoNameInput(): void {
        const val = this.equipo.equipo || '';
        if (val.length < 1) {
            this.filteredEquipoNames = [];
            return;
        }

        const search = val.toLowerCase();
        this.filteredEquipoNames = this.existingEquipoNames
            .filter(name => name.toLowerCase().includes(search))
            .filter(name => name.toLowerCase() !== search)
            .slice(0, 5);
    }

    selectEquipoName(name: string): void {
        this.equipo.equipo = name;
        this.filteredEquipoNames = [];
    }

    onNameInput(): void {
        const val = this.componente.componente || '';
        if (val.length < 1) {
            this.filteredNames = [];
            return;
        }

        const search = val.toLowerCase();
        this.filteredNames = this.existingComponentNames
            .filter(name => name.toLowerCase().includes(search))
            .filter(name => name.toLowerCase() !== search) // No mostrar si ya es idéntico
            .slice(0, 5); // Limitar a 5 sugerencias
    }

    selectName(name: string): void {
        this.componente.componente = name;
        this.filteredNames = [];
    }

    loadData(): void {
        this.loading = true;
        if (this.type === 'equipo') {
            this.dataService.getEquipoById(this.id).subscribe({
                next: (data) => { this.equipo = data; this.loading = false; },
                error: () => this.handleError()
            });
        } else if (this.type === 'componente') {
            this.dataService.getComponenteById(this.id).subscribe({
                next: (data) => {
                    // Asegurar que los IDs sean numéricos para que coincidan con los [ngValue] del select
                    if (data.codigo_unidad != null) data.codigo_unidad = Number(data.codigo_unidad);
                    if (data.codigo_equipo != null) data.codigo_equipo = Number(data.codigo_equipo);
                    this.componente = data;
                    this.loading = false;
                },
                error: () => this.handleError()
            });
        } else if (this.type as any === 'unidad' || this.type as any === 'unidades') {
            this.dataService.getUnidadById(this.id).subscribe({
                next: (data) => { this.unidad = data; this.loading = false; },
                error: () => this.handleError()
            });
        } else {
            this.handleError();
        }
    }

    handleError(): void {
        alert('Error al cargar la información del registro.');
        this.cancel();
    }

    confirmSave(): void {
        if (!confirm('¿Estás seguro de que deseas confirmar las modificaciones?')) return;
        this.save();
    }

    save(): void {
        this.saving = true;
        let obs$: Observable<any>;
        let details = '';
        const isNew = this.id === 0;

        if (this.type === 'equipo') {
            obs$ = isNew ? this.dataService.createEquipo(this.equipo) : this.dataService.updateEquipo(this.id, this.equipo);
            details = `${isNew ? 'Creó' : 'Editó'} Equipo: ${this.equipo.equipo}`;
        } else if (this.type === 'componente') {
            obs$ = isNew ? this.dataService.createComponente(this.componente) : this.dataService.updateComponente(this.id, this.componente);
            details = `${isNew ? 'Creó' : 'Editó'} Componente: ${this.componente.componente} (Serie: ${this.componente.serie})`;
        } else {
            obs$ = isNew ? this.dataService.createUnidad(this.unidad) : this.dataService.updateUnidad(this.id, this.unidad);
            details = `${isNew ? 'Creó' : 'Editó'} Unidad: ${this.unidad.nombre_de_la_unidad}`;
        }

        obs$.subscribe({
            next: (savedItem) => {
                this.logHistory(isNew ? 'CREATE' : 'EDIT', details, savedItem);
            },
            error: (err: any) => {
                this.saving = false;
                alert('Error al guardar: ' + (err.error?.message || 'Error desconocido'));
            }
        });
    }

    logHistory(accion: 'EDIT' | 'DELETE' | 'CREATE', detalles: string, savedItem?: any): void {
        const user = this.auth.getUserName() || 'Admin';
        const entityId = this.id === 0 && savedItem ?
            (savedItem.codigo_componente || savedItem.codigo_equipo || savedItem.codigo_unidad) :
            this.id;

        const registro = {
            accion,
            tipo_entidad: this.type,
            id_entidad: entityId,
            usuario: user,
            detalles
        };

        this.dataService.addHistorial(registro).subscribe({
            next: () => {
                alert('Modificación realizada y registrada con éxito.');
                this.cancel();
            },
            error: (err) => {
                console.error('Error en historial:', err);
                // Si el status es 2xx, es probable que sea un error de parseo pero se guardó bien
                if (err.status >= 200 && err.status < 300) {
                    alert('Modificación realizada y registrada con éxito.');
                    this.cancel();
                } else {
                    alert('Modificación realizada, pero hubo un error al registrar en el historial (Servidor).');
                    this.cancel();
                }
            }
        });
    }

    cancel(): void {
        // Volvemos al dashboard. 
        // Si venimos de un informe de unidad, lo ideal sería volver a esa unidad específica.
        // Pero por simplicidad volvemos al dashboard general.
        this.router.navigate(['/dashboard']);
    }
}
