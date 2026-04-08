import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UnidadAgrupada } from '../models/data.model';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    exportUnidadAgrupada(data: UnidadAgrupada): void {
        const doc = new jsPDF();
        const azulInstitucional = [26, 58, 143]; // #1a3a8f
        const doradoInstitucional = [245, 197, 24]; // #f5c518

        // ENCABEZADO
        doc.setFillColor(azulInstitucional[0], azulInstitucional[1], azulInstitucional[2]);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('BN. COM. Nro 2', 105, 18, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('SISTEMA DE GESTIÓN DE EQUIPOS', 105, 28, { align: 'center' });

        // INFORMACIÓN DE LA UNIDAD
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`INFORME DE UNIDAD: ${data.unidad.unidad}`, 14, 55);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.unidad.nombre_de_la_unidad}`, 14, 62);
        doc.text(`Ámbito: ${data.unidad.ambito || 'N/A'}`, 14, 68);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 74);

        let currentY = 85;

        // RECORRIDO DE EQUIPOS Y COMPONENTES
        data.equipos.forEach((item, index) => {
            // Título del Equipo
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(azulInstitucional[0], azulInstitucional[1], azulInstitucional[2]);
            doc.text(`EQUIPO: ${item.equipo || 'Sin Nombre'} (ID: ${item.codigo_equipo})`, 14, currentY);

            currentY += 5;

            // Tabla de Componentes del Equipo
            const tableData = item.componentes.map(c => [
                c.codigo_componente.toString(),
                c.componente,
                c.serie || '-',
                c.total || '-',
                c.Nro_alta || '-'
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['CÓDIGO', 'COMPONENTE', 'SERIE', 'CANTIDAD', 'NRO_ALTA']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [26, 58, 143],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                styles: { fontSize: 8, cellPadding: 3 },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    currentY = data.cursor!.y + 15;
                }
            });

            // Si nos pasamos de la página, autoTable ya maneja el salto, pero currentY debe actualizarse
            // Usamos el cursor del hook de autoTable para seguir escribiendo abajo.
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }
        });

        // PIE DE PÁGINA
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
            doc.text('Documento generado institucionalmente por Misiones Programa', 105, 290, { align: 'center' });
        }

        // DESCARGAR
        doc.save(`Informe_${data.unidad.unidad.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    }
}
