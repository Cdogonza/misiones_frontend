import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Componente } from '../models/data.model';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {
    constructor() { }

    exportComponentesToExcel(data: Componente[], fileName: string): void {
        const formattedData = data.map(c => ({
            'Código': c.codigo_componente,
            'Equipo': c.equipo || 'S/E',
            'Componente': c.componente,
            'Serie': c.serie || 'N/A',
            'Total': c.total,
            'Ubicación': c.ubicacion || 'N/A',
            'Estado': c.estado || 'N/A',
            'Nro Alta': c.Nro_alta || 'N/A',
            'Clasificación': c.clasificacion || 'N/A',
            'Lugar': c.lugar || 'N/A',
            'Observación': c.observacion || '-'
        }));

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook: XLSX.WorkBook = { 
            Sheets: { 'Componentes': worksheet }, 
            SheetNames: ['Componentes'] 
        };
        
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, fileName);
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        });
        const date = new Date().toISOString().slice(0, 10);
        saveAs(data, `${fileName}_${date}.xlsx`);
    }
}
