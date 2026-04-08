import { Injectable } from '@angular/core';
import { Equipo, Componente, Unidad, UnidadAgrupada } from '../models/data.model';

type DashboardView = 'informe' | 'componentes' | 'equipos' | 'unidades';

export interface DashboardState {
    activeView: DashboardView;

    // Vista: Informe
    searchText: string;
    selectedUnidad: Unidad | null;
    unidadAgrupada: UnidadAgrupada | null;
    reportSearchText: string;

    // Listas de datos
    unidades: Unidad[];
    equipos: Equipo[];
    componentes: Componente[];

    // Control de tablas visibles
    showTable: { [key in DashboardView]: boolean };

    // Textos de búsqueda por vista
    viewSearchText: { [key in DashboardView]: string };
}

@Injectable({
    providedIn: 'root'
})
export class DashboardStateService {

    private state: DashboardState = {
        activeView: 'informe',
        searchText: '',
        selectedUnidad: null,
        unidadAgrupada: null,
        reportSearchText: '',
        unidades: [],
        equipos: [],
        componentes: [],
        showTable: {
            informe: true,
            componentes: false,
            equipos: false,
            unidades: false
        },
        viewSearchText: {
            informe: '',
            componentes: '',
            equipos: '',
            unidades: ''
        }
    };

    getState(): DashboardState {
        return this.state;
    }

    patch(partial: Partial<DashboardState>): void {
        this.state = { ...this.state, ...partial };
    }

    reset(): void {
        this.state = {
            activeView: 'informe',
            searchText: '',
            selectedUnidad: null,
            unidadAgrupada: null,
            reportSearchText: '',
            unidades: [],
            equipos: [],
            componentes: [],
            showTable: {
                informe: true,
                componentes: false,
                equipos: false,
                unidades: false
            },
            viewSearchText: {
                informe: '',
                componentes: '',
                equipos: '',
                unidades: ''
            }
        };
    }
}
