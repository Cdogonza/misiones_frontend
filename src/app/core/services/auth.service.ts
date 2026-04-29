import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserProfile } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API = `${environment.apiUrl}/api/auth`;
    private readonly USUARIOS_API = `${environment.apiUrl}/api/usuarios`;
    private readonly USER_API = `${environment.apiUrl}/api/usuarios`;
    private readonly TOKEN_KEY = 'misiones_token';

    constructor(private http: HttpClient) { }

    login(payload: LoginRequest): Observable<LoginResponse> {
        // Map usuario to username for the backend
        const body = { username: payload.usuario, password: payload.password };
        return this.http.post<LoginResponse>(`${this.API}/login`, body).pipe(
            tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
        );
    }

    register(payload: RegisterRequest): Observable<RegisterResponse> {
        // Map to backend keys
        const body = { 
            username: payload.usuario, 
            email: payload.correo, 
            password: payload.password,
            oficina: payload.oficina,
            rol: payload.rol
        };
        return this.http.post<any>(`${this.API}/register`, body).pipe(
            map((res: any) => ({
                idusuario: res.idusuario,
                usuario: res.username,
                correo: res.email,
                oficina: res.oficina,
                rol: res.rol
            }))
        );
    }

    getProfile(): Observable<UserProfile> {
        return this.http.get<any>(`${this.USUARIOS_API}/perfil`).pipe(
            map((res: any) => ({
                idusuario: res.idusuario,
                username: res.usuario || res.username,
                email: res.email || res.email,
                oficina: res.oficina,
                rol: res.rol
            }))
        );
    }

    updateEmail(correo: string): Observable<any> {
        return this.http.put(`${this.USUARIOS_API}/email`, { email: correo });
    }

    updatePassword(password: string): Observable<any> {
        return this.http.put(`${this.USUARIOS_API}/password`, { password });
    }

    getUsers(): Observable<UserProfile[]> {
        return this.http.get<any[]>(`${this.USER_API}/`).pipe(
            map((users: any[]) => users.map((u: any) => ({
                idusuario: u.idusuario,
                username: u.usuario || u.username,
                email: u.correo || u.email,
                oficina: u.oficina,
                rol: u.rol
            })))
        );
    }

    resetPassword(id: number): Observable<any> {
        return this.http.put(`${this.USER_API}/reset-password/${id}`, {});
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isLoggedIn(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    isAdmin(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.rol === 'admin' || payload.rol === 'superAdmin';
        } catch {
            return false;
        }
    }

    isSuperAdmin(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.rol === 'superAdmin';
        } catch {
            return false;
        }
    }

    getOficinas(): Observable<string[]> {
        return this.http.get<string[]>(`${this.USER_API}/oficinas`);
    }

    getUserName(): string | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.usuario || payload.nombre || payload.username || payload.name || 'Usuario';
            
        } catch {
            return null;
        }
    }

    getUserOficina(): string | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('[AuthService] JWT payload:', payload); // DEBUG - remove later
            return payload.oficina || null;
        } catch {
            return null;
        }
    }

    /** Devuelve true si el usuario pertenece a una oficina de jefatura
     *  con acceso dual (dashboard + deposito): Jefe, 2do Jefe, Cte. de Ca. */
    isJefatura(): boolean {
        const oficina = this.getUserOficina();
        if (!oficina) return false;
        const o = oficina.trim().toLowerCase();
        return (
            o === 'jefe' ||
            o === '2do jefe' ||
            o === 'cte. de ca.' ||
            o === 'Cte. de Ca.' ||
            o === 'Jefe de Seccion Abast.' ||
            o === 'Jefe de Seccion Mant.'
        );
    }
}
