import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Equipo, Componente, Unidad, UnidadAgrupada } from '../models/data.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly EQUIPOS_API = `${environment.apiUrl}/api/equipos`;
    private readonly COMPONENTES_API = `${environment.apiUrl}/api/componentes`;
    private readonly UNIDADES_API = `${environment.apiUrl}/api/unidades`;
    private readonly PEDIDOS_API = `${environment.apiUrl}/api/pedidos`;
    private readonly HISTORIAL_API = `${environment.apiUrl}/health`;

    private draftsCountSubject = new BehaviorSubject<number>(0);
    public draftsCount$ = this.draftsCountSubject.asObservable();

    constructor(private http: HttpClient) { 
        this.refreshDraftsCount();
    }

    refreshDraftsCount(): void {
        this.getAllPedidos().subscribe(pedidos => {
            const count = pedidos.filter(p => p.estado === 'borrador').length;
            this.draftsCountSubject.next(count);
        });
    }

    // EQUIPOS
    getEquipos(): Observable<Equipo[]> {
        return this.http.get<Equipo[]>(this.EQUIPOS_API);
    }
    getEquipoById(id: number): Observable<Equipo> {
        return this.http.get<Equipo>(`${this.EQUIPOS_API}/${id}`);
    }
    createEquipo(data: Partial<Equipo>): Observable<Equipo> {
        return this.http.post<Equipo>(this.EQUIPOS_API, data);
    }
    updateEquipo(id: number, data: Partial<Equipo>): Observable<Equipo> {
        return this.http.put<Equipo>(`${this.EQUIPOS_API}/${id}`, data);
    }
    deleteEquipo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.EQUIPOS_API}/${id}`);
    }

    // COMPONENTES
    getComponentes(): Observable<Componente[]> {
        return this.http.get<Componente[]>(this.COMPONENTES_API);
    }
    getComponenteById(id: number): Observable<Componente> {
        return this.http.get<Componente>(`${this.COMPONENTES_API}/${id}`);
    }
    getComponentesByUnidad(codigoUnidad: number): Observable<Componente[]> {
        return this.http.get<Componente[]>(`${this.COMPONENTES_API}?codigo_unidad=${codigoUnidad}`);
    }
    createComponente(data: Partial<Componente>): Observable<Componente> {
        return this.http.post<Componente>(this.COMPONENTES_API, data);
    }
    updateComponente(id: number, data: Partial<Componente>): Observable<Componente> {
        return this.http.put<Componente>(`${this.COMPONENTES_API}/${id}`, data);
    }
    deleteComponente(id: number): Observable<void> {
        return this.http.delete<void>(`${this.COMPONENTES_API}/${id}`);
    }

    // UNIDADES
    getUnidades(): Observable<Unidad[]> {
        return this.http.get<Unidad[]>(this.UNIDADES_API);
    }
    getUnidadById(id: number): Observable<Unidad> {
        return this.http.get<Unidad>(`${this.UNIDADES_API}/${id}`);
    }
    getUnidadAgrupada(id: number): Observable<UnidadAgrupada> {
        return this.http.get<UnidadAgrupada>(`${this.UNIDADES_API}/${id}/agrupado`);
    }
    createUnidad(data: Partial<Unidad>): Observable<Unidad> {
        return this.http.post<Unidad>(this.UNIDADES_API, data);
    }
    updateUnidad(id: number, data: Partial<Unidad>): Observable<Unidad> {
        return this.http.put<Unidad>(`${this.UNIDADES_API}/${id}`, data);
    }
    deleteUnidad(id: number): Observable<void> {
        return this.http.delete<void>(`${this.UNIDADES_API}/${id}`);
    }

    // HISTORIAL
    addHistorial(registro: any): Observable<any> {
        return this.http.get<any>(this.HISTORIAL_API);
    }

    // PEDIDOS
    createPedido(idusuario: number, items: any[], observaciones: string, config?: { codigo_unidad_destino?: number, fecha_inicio?: string, fecha_fin?: string, estado?: string }): Observable<any> {
        return this.http.post<any>(this.PEDIDOS_API, { idusuario, items, observaciones, ...config }).pipe(
            tap(() => this.refreshDraftsCount())
        );
    }

    getAllPedidos(): Observable<any[]> {
        return this.http.get<any[]>(this.PEDIDOS_API);
    }

    getPedidosByUsuario(idusuario: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.PEDIDOS_API}/usuario/${idusuario}`);
    }

    updatePedidoEstado(idpedido: number, estado: string, observaciones_devolucion?: string): Observable<any> {
        return this.http.patch<any>(`${this.PEDIDOS_API}/${idpedido}/estado`, { estado, observaciones_devolucion }).pipe(
            tap(() => this.refreshDraftsCount())
        );
    }

    updatePedido(idpedido: number, data: any): Observable<any> {
        return this.http.patch<any>(`${this.PEDIDOS_API}/${idpedido}`, data).pipe(
            tap(() => this.refreshDraftsCount())
        );
    }

    deletePedido(idpedido: number): Observable<any> {
        return this.http.delete<any>(`${this.PEDIDOS_API}/${idpedido}`).pipe(
            tap(() => this.refreshDraftsCount())
        );
    }
}
