import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Repuesto } from '../models/repuesto.model';

@Injectable({
  providedIn: 'root'
})
export class RepuestosService {
  private apiUrl = `${environment.apiUrl}/api/repuestos`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(this.apiUrl);
  }

  getById(id: number): Observable<Repuesto> {
    return this.http.get<Repuesto>(`${this.apiUrl}/${id}`);
  }

  create(data: Repuesto): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: number, data: Repuesto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
