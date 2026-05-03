export interface Mantenimiento {
    id_mantenimiento?: number;
    fecha_entrada: string;
    equipo: string;
    marca: string;
    nro_serie: string;
    procedencia: string;
    entrega: string;
    recibe: string;
    tel_contacto: string;
    calidad: string;
    ubicacion: string;
    estado: string;
    presupuesto: string;
    desc_inicial?: string;
    desc_final?: string;
    tecnico: string;
    fecha_final?: string;
    id_boleta?: string;
}
