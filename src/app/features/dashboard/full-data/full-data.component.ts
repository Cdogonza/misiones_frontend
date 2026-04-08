import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ExcelService } from '../../../core/services/excel.service';
import { Componente, Unidad } from '../../../core/models/data.model';

@Component({
    selector: 'app-full-data',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './full-data.component.html',
    styleUrl: './full-data.component.scss'
})
export class FullDataComponent implements OnInit {
    codigoUnidad: number | null = null;
    componentes: Componente[] = [];
    unidad: Unidad | null = null;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: DataService,
        private excelService: ExcelService
    ) { }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.codigoUnidad = idParam ? Number(idParam) : null;

        if (this.codigoUnidad) {
            this.loadData();
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    onExportExcel(): void {
        if (this.componentes.length > 0) {
            const unitName = this.unidad ? this.unidad.unidad : 'Unidad';
            this.excelService.exportComponentesToExcel(this.componentes, `Datos_Completos_${unitName}`);
        }
    }

    loadData(): void {
        this.loading = true;
        // Cargar info de la unidad para el encabezado
        this.dataService.getUnidadById(this.codigoUnidad!).subscribe({
            next: (u) => this.unidad = u,
            error: () => console.error('Error al cargar unidad')
        });

        // Cargar todos los componentes del backend
        this.dataService.getComponentesByUnidad(this.codigoUnidad!).subscribe({
            next: (data) => {
                this.componentes = data;
                this.loading = false;
            },
            error: () => {
                alert('Error al cargar datos técnicos completos.');
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }
}
