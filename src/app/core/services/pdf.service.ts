import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  private addInstitutionalHeader(doc: jsPDF, title: string): number {
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo Central (Suponiendo que logo_boleta.png está en assets/img/)
    try {
      doc.addImage('assets/img/logo_boleta.png', 'PNG', (pageWidth / 2) - 15, 10, 30, 30);
    } catch (e) {
      // Si falla, intentamos con logo.png que sabemos que existe en public/
      try {
        doc.addImage('logo.png', 'PNG', (pageWidth / 2) - 15, 10, 30, 30);
      } catch (e2) {
        console.warn('No se pudo cargar el logo institucional');
      }
    }

    doc.setFontSize(16);
    doc.setTextColor(26, 58, 143);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 50, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    return 55; // Posición Y para continuar el contenido
  }

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

    // Header Institucional
    const startY = this.addInstitutionalHeader(doc, title);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 190, 10, { align: 'right' });
    doc.text(`Nro. Pedido: #${pedido.idpedido}`, 190, 15, { align: 'right' });

    // Información del Préstamo
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('INFORMACIÓN GENERAL', 15, startY + 5);
    doc.line(15, startY + 7, 195, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Unidad que Entrega:', 15, startY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(giverName, 60, startY + 15);

    doc.setFont('helvetica', 'bold');
    doc.text('Unidad que Recibe:', 15, startY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(receiverName, 60, startY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text('Período de Préstamo:', 15, startY + 29);
    doc.setFont('helvetica', 'normal');
    const fInit = pedido.fecha_inicio || pedido.fechaInicio;
    const fEnd = pedido.fecha_fin || pedido.fechaFin;
    doc.text(`Desde ${fInit || 'N/A'} hasta ${fEnd || 'N/A'}`, 60, startY + 29);

    // Tabla de Elementos
    const tableData = items.map(item => [
      item.cantidad,
      item.componente || item.nombre,
      item.serie || '-',
      item.equipo || 'N/A'
    ]);

    autoTable(doc, {
      startY: startY + 40,
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

    const startY = this.addInstitutionalHeader(doc, 'PARTE DE EQUIPO');

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(unidad.nombre_de_la_unidad || 'Sin Nombre', 105, startY + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 190, 10, { align: 'right' });

    let currentY = startY + 15;

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

  generateMantenimientoBoletaPDF(records: any[]): void {
    if (!records || records.length === 0) return;

    const doc = new jsPDF();
    const firstRecord = records[0];
    const dateStr = firstRecord.fecha_entrada || new Date().toLocaleDateString();
    
    const procedencia = firstRecord.procedencia || 'N/A';
    const entrega = firstRecord.entrega || '____________________';
    const boletaId = firstRecord.id_boleta || 'N/A';
    
    // Header Institucional
    const startY = this.addInstitutionalHeader(doc, 'BOLETA DE INGRESO A MANTENIMIENTO');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 190, 10, { align: 'right' });
    doc.text(`Nro. Boleta: ${boletaId}`, 190, 15, { align: 'right' });

    // Información General
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('INFORMACIÓN DE INGRESO', 15, startY + 5);
    doc.line(15, startY + 7, 195, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Procedencia (Unidad):', 15, startY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(procedencia, 60, startY + 15);

    doc.setFont('helvetica', 'bold');
    doc.text('Entregado por:', 15, startY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(firstRecord.entrega || 'N/A', 60, startY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text('Tel. de Contacto:', 15, startY + 29);
    doc.setFont('helvetica', 'normal');
    doc.text(firstRecord.tel_contacto || 'N/A', 60, startY + 29);

    // Tabla de Equipos
    const tableData = records.map(item => [
      item.id_mantenimiento || 'N/A',
      item.equipo || 'N/A',
      item.marca || '-',
      item.nro_serie || '-',
      item.desc_inicial || '-'
    ]);

    autoTable(doc, {
      startY: startY + 40,
      head: [['ID', 'Equipo', 'Marca', 'Nro. Serie', 'Observaciones']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 143], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }
      }
    });

    // Firmas
    const pageHeight = doc.internal.pageSize.height;
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    const signaturesY = Math.max(finalY, pageHeight - 50);

    doc.setFontSize(10);
    doc.line(30, signaturesY, 80, signaturesY);
    doc.text('Firma Quien Entrega', 55, signaturesY + 5, { align: 'center' });
    // doc.text(entrega, 55, signaturesY + 10, { align: 'center' }); // Se quita el nombre personal

    doc.line(130, signaturesY, 180, signaturesY);
    doc.text('Firma Quien Recibe', 155, signaturesY + 5, { align: 'center' });
    // Se deja en blanco para que se complete a mano
    
    // Guardar
    const fileName = `Boleta_Mantenimiento_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }

  generateMantenimientoDevolucionPDF(records: any[], originalBoletaId: string): void {
    if (!records || records.length === 0) return;

    const doc = new jsPDF();
    const firstRecord = records[0];
    const dateStr = new Date().toLocaleDateString();
    
    const procedencia = firstRecord.procedencia || 'N/A';
    // Para devolución, invierto: quien lo recibió originalmente o el mantenedor ahora es el que entrega
    const recibe = firstRecord.recibe || '____________________'; 
    const entregaMantenimiento = firstRecord.tecnico || 'Mantenimiento';
    
    // Header Institucional
    const startY = this.addInstitutionalHeader(doc, 'BOLETA DE DEVOLUCIÓN DE MANTENIMIENTO');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha Devolución: ${dateStr}`, 190, 10, { align: 'right' });
    doc.text(`Boleta Ingreso Orig.: ${originalBoletaId}`, 190, 15, { align: 'right' });

    // Información General
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('INFORMACIÓN DE DEVOLUCIÓN', 15, startY + 5);
    doc.line(15, startY + 7, 195, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Procedencia:', 15, startY + 15);
    doc.text('Devuelto a:', 15, startY + 22);
    
    doc.setFont('helvetica', 'normal');
    doc.text(procedencia, 60, startY + 15);
    doc.text(recibe, 60, startY + 22);

    // Formatting helper
    const formatDateStr = (date: string | undefined) => {
      if (!date || date === '1000-01-01') return '-';
      // Mantenemos solo la parte YYYY-MM-DD o parseamos
      const parts = date.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return new Date(date).toLocaleDateString();
    };

    // Tabla de Equipos
    const tableData = records.map(item => [
      item.id_mantenimiento || 'N/A',
      formatDateStr(item.fecha_entrada),
      item.equipo || 'N/A',
      item.marca || '-',
      item.nro_serie || '-',
      item.desc_final || 'Devuelto al usuario',
      formatDateStr(item.fecha_final)
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['ID', 'Ingreso', 'Equipo', 'Marca', 'Nro. Serie', 'Observaciones', 'Fin']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 143], textColor: [255, 255, 255] }, // Verde para devolución
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' }
      }
    });

    // Firmas
    const pageHeight = doc.internal.pageSize.height;
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    const signaturesY = Math.max(finalY, pageHeight - 50);

    doc.setFontSize(10);
    doc.line(30, signaturesY, 80, signaturesY);
    doc.text('Firma Quien Entrega (Mantenimiento)', 55, signaturesY + 5, { align: 'center' });
    // doc.text(entregaMantenimiento, 55, signaturesY + 10, { align: 'center' }); // Se quita el nombre personal

    doc.line(130, signaturesY, 180, signaturesY);
    doc.text('Firma Quien Recibe (Usuario)', 155, signaturesY + 5, { align: 'center' });
    // doc.text(recibe, 155, signaturesY + 10, { align: 'center' }); // Se quita el nombre personal
    
    // Guardar
    const fileName = `Boleta_Devolucion_${originalBoletaId.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }

  generatePresupuestoPDF(mantenimiento: any, items: any[], tecnico: string): void {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    // Header Institucional
    const startY = this.addInstitutionalHeader(doc, 'PRESUPUESTO TÉCNICO DE REPARACIÓN');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 190, 10, { align: 'right' });
    doc.text(`ID Mantenimiento: #${mantenimiento.id_mantenimiento}`, 190, 15, { align: 'right' });

    // Información del Equipo
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('INFORMACIÓN DEL EQUIPO', 15, startY + 5);
    doc.line(15, startY + 7, 195, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Equipo:', 15, startY + 15);
    doc.text('Marca/Modelo:', 15, startY + 22);
    doc.text('Nro. Serie:', 15, startY + 29);
    doc.text('Técnico:', 105, startY + 29);
    
    doc.setFont('helvetica', 'normal');
    doc.text(mantenimiento.equipo || 'N/A', 60, startY + 15);
    doc.text(mantenimiento.marca || '-', 60, startY + 22);
    doc.text(mantenimiento.nro_serie || '-', 60, startY + 29);
    doc.text(tecnico, 125, startY + 29);

    // Tabla de Repuestos
    const tableData = items.map(item => [
      item.nombre,
      item.descripcion || '-',
      item.cantidad || 1,
      `$${item.costo_unitario?.toLocaleString()}`,
      `$${((item.cantidad || 1) * (item.costo_unitario || 0)).toLocaleString()}`
    ]);

    const total = items.reduce((acc, item) => acc + ((item.cantidad || 1) * (item.costo_unitario || 0)), 0);

    autoTable(doc, {
      startY: startY + 40,
      head: [['Repuesto', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 143], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL PRESUPUESTO: $${total.toLocaleString()}`, 195, finalY, { align: 'right' });

    // Firmas
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.line(75, pageHeight - 40, 135, pageHeight - 40);
    doc.text('Firma Responsable Técnico', 105, pageHeight - 35, { align: 'center' });
    doc.text(tecnico, 105, pageHeight - 30, { align: 'center' });

    const fileName = `Presupuesto_Mantenimiento_${mantenimiento.id_mantenimiento}.pdf`;
    doc.save(fileName);
  }
}
