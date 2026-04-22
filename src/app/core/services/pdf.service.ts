import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generateReceiptPDF(pedido: any, items: any[], unidades: any[], type: 'entrega' | 'recepcion' = 'entrega'): void {
    const doc = new jsPDF();
    const dateStr = pedido.created_at ? new Date(pedido.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Buscar nombre de unidad destino
    const nombreDestino = pedido.unidad_destino_nombre || 
                         unidades.find(u => u.codigo_unidad === pedido.codigo_unidad_destino)?.nombre_de_la_unidad || 
                         'N/A';

    // Configuración según tipo
    const title = type === 'entrega' ? 'RECIBO DE ENTREGA DE MATERIAL' : 'RECIBO DE RECEPCIÓN DE MATERIAL';
    const giverName = type === 'entrega' ? 'Bn. Com. Nro 2' : nombreDestino;
    const receiverName = type === 'entrega' ? nombreDestino : 'Bn. Com. Nro 2';
    const observations = type === 'entrega' ? pedido.observaciones : (pedido.observaciones_devolucion || 'Sin observaciones de recepción');

    // Cabecera institucional
    doc.setFontSize(18);
    doc.setTextColor(26, 58, 143); // Azul institucional
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 190, 10, { align: 'right' });
    doc.text(`Nro. Pedido: #${pedido.idpedido}`, 190, 15, { align: 'right' });

    // Información del Préstamo
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('INFORMACIÓN GENERAL', 15, 35);
    doc.line(15, 37, 195, 37);

    doc.setFont('helvetica', 'bold');
    doc.text('Unidad que Entrega:', 15, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(giverName, 60, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Unidad que Recibe:', 15, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(receiverName, 60, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('Período de Préstamo:', 15, 59);
    doc.setFont('helvetica', 'normal');
    const fInit = pedido.fecha_inicio || pedido.fechaInicio;
    const fEnd = pedido.fecha_fin || pedido.fechaFin;
    doc.text(`Desde ${fInit || 'N/A'} hasta ${fEnd || 'N/A'}`, 60, 59);

    // Tabla de Elementos
    const tableData = items.map(item => [
      item.cantidad,
      item.componente || item.nombre,
      item.serie || '-',
      item.equipo || 'N/A'
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Cantidad', 'Componente / Material', 'Serie', 'Equipo / Origen']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 143], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Observaciones
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (observations) {
      doc.setFont('helvetica', 'bold');
      doc.text(type === 'entrega' ? 'Observaciones de Entrega:' : 'Observaciones de Recepción:', 15, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitObs = doc.splitTextToSize(observations, 180);
      doc.text(splitObs, 15, finalY + 7);
    }

    // Firmas
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.line(30, pageHeight - 40, 80, pageHeight - 40);
    doc.text('Firma Entrega', 55, pageHeight - 35, { align: 'center' });
    doc.text(giverName, 55, pageHeight - 30, { align: 'center' });

    doc.line(130, pageHeight - 40, 180, pageHeight - 40);
    doc.text('Firma Recepción', 155, pageHeight - 35, { align: 'center' });
    doc.text(receiverName, 155, pageHeight - 30, { align: 'center' });

    // Guardar
    const fileName = type === 'entrega' ? `Boleta_Entrega_${pedido.idpedido}.pdf` : `Boleta_Recepcion_${pedido.idpedido}.pdf`;
    doc.save(fileName);
  }

  exportUnidadAgrupada(agrupada: any): void {
    const doc = new jsPDF();
    const unidad = agrupada.unidad;
    const equipos = agrupada.equipos || [];

    // Cabecera
    doc.setFontSize(18);
    doc.setTextColor(26, 58, 143);
    doc.text('INFORME TÉCNICO DE UNIDAD', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(unidad.nombre_de_la_unidad || 'Sin Nombre', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 190, 10, { align: 'right' });

    let currentY = 40;

    equipos.forEach((eq: any, index: number) => {
      // Verificar si necesitamos nueva página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(26, 58, 143);
      doc.setFont('helvetica', 'bold');
      doc.text(`EQUIPO: ${eq.equipo || 'N/A'}`, 15, currentY);
      
      const tableData = (eq.componentes || []).map((c: any) => [
        c.componente,
        c.serie || '-',
        c.total || '-',
        c.estado || '-',
        c.ubicacion || '-'
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Componente', 'Serie', 'Cant.', 'Estado', 'Ubicación']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    const fileName = `Informe_${(unidad.nombre_de_la_unidad || 'Unidad').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }
}
