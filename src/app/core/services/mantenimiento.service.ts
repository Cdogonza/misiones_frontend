import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mantenimiento } from '../models/mantenimiento.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MantenimientoService {
    private readonly API = `${environment.apiUrl}/api/mantenimiento`;

    constructor(private http: HttpClient) { }

    getAll(filters?: any): Observable<Mantenimiento[]> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.append(key, filters[key]);
                }
            });
        }
        return this.http.get<Mantenimiento[]>(this.API, { params });
    }

    getById(id: number): Observable<Mantenimiento> {
        return this.http.get<Mantenimiento>(`${this.API}/${id}`);
    }

    private formatDates(data: any): any {
        const formatted = { ...data };
        if (formatted.fecha_entrada && typeof formatted.fecha_entrada === 'string') {
            formatted.fecha_entrada = formatted.fecha_entrada.split('T')[0];
        }
        if (formatted.fecha_final && typeof formatted.fecha_final === 'string') {
            formatted.fecha_final = formatted.fecha_final.split('T')[0];
        }
        return formatted;
    }

    create(data: Mantenimiento): Observable<Mantenimiento> {
        return this.http.post<Mantenimiento>(this.API, this.formatDates(data));
    }

    update(id: number, data: Partial<Mantenimiento>): Observable<Mantenimiento> {
        return this.http.put<Mantenimiento>(`${this.API}/${id}`, this.formatDates(data));
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API}/${id}`);
    }
}
