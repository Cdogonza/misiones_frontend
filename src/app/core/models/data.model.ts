export interface Equipo {
    codigo_equipo: number;
    equipo: string;
}

export interface Componente {
    codigo_componente: number;
    codigo_equipo: number;
    componente: string;
    serie?: string;
    total?: number;
    codigo_unidad?: number;
    ubicacion?: string;
    estado?: string;
    Nro_alta?: string;
    Nro_baja?: string | null;
    lugar?: string;
    clasificacion?: string;
    observacion?: string;
    equipo?: string;
}

export interface Unidad {
    codigo_unidad: number;
    unidad: string;
    nombre_de_la_unidad: string;
    ambito?: string | null;
}

export interface UnidadAgrupada {
    unidad: Unidad;
    equipos: (Equipo & { componentes: Componente[] })[];
}

export interface Historial {
    id_historial?: number;
    accion: 'EDIT' | 'DELETE' | 'CREATE';
    tipo_entidad: 'equipo' | 'componente' | 'unidad';
    id_entidad: number;
    usuario: string;
    fecha?: string;
    detalles: string;
}

export interface CartItem {
    componentId: number;
    nombre: string;
    equipo: string;
    serie?: string;
    cantidad: number;
}
