import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './selector.component.html',
    styleUrl: './selector.component.scss'
})
export class SelectorComponent implements OnInit {
    username = '';

    constructor(private auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        // Si no es jefatura, redirigir según su perfil
        if (!this.auth.isJefatura()) {
            const oficina = this.auth.getUserOficina();
            if (oficina?.toLowerCase().includes('deposito')) {
                this.router.navigate(['/deposito']);
            } else {
                this.router.navigate(['/dashboard']);
            }
        const hasJefatura = this.auth.isJefatura();
        const hasMantenimiento = this.auth.canAccessMantenimiento();
        const oficina = this.auth.getUserOficina() || '';
        const isDeposito = oficina.toLowerCase().includes('deposito');
        
        // Determinar si es una oficina específica
        const isRecYEntrega = oficina.trim() === 'Rec. y Entrega';
        const isSalaI = oficina.includes('Sala I');

        // Inspecciones es el dashboard por defecto, a menos que sea una oficina exclusiva
        const isOnlyMantenimiento = hasMantenimiento && !hasJefatura && !isDeposito;

        this.canAccessDeposito = isDeposito || hasJefatura;
        this.canAccessInspecciones = !isOnlyMantenimiento || hasJefatura; 

        let accessCount = 0;
        if (this.canAccessDeposito) accessCount++;
        if (this.canAccessInspecciones) accessCount++;
        if (hasMantenimiento) accessCount++;

        if (accessCount === 1 && !hasJefatura) {
            if (hasMantenimiento && isSalaI) this.router.navigate(['/mantenimiento/sala-i']);
            else if (hasMantenimiento && isRecYEntrega) this.router.navigate(['/mantenimiento']);
            else if (this.canAccessDeposito) this.router.navigate(['/deposito']);
            else this.router.navigate(['/dashboard']);
            return;
        }
        this.username = this.auth.getUserName() || 'Comandante';
    }

    canSeeMainMantenimiento(): boolean {
        const oficina = this.auth.getUserOficina() || '';
        return oficina.includes('Rec. y Entrega') || this.auth.isJefatura() || this.auth.isAdmin();
    }

    canSeeSalaI(): boolean {
        const oficina = this.auth.getUserOficina() || '';
        return oficina.includes('Sala I') || this.auth.isJefatura() || this.auth.isAdmin();
    }

    goToInspecciones(): void {
        this.router.navigate(['/dashboard']);
    }

    goToDeposito(): void {
        this.router.navigate(['/deposito']);
    }

    goToMantenimiento(): void {
        this.router.navigate(['/mantenimiento']);
    }

    goToSalaI(): void {
        this.router.navigate(['/mantenimiento/sala-i']);
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
