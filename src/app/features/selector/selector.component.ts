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
    canAccessDeposito = false;
    canAccessInspecciones = true;

    constructor(public auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        const hasJefatura = this.auth.isJefatura();
        const hasMantenimiento = this.auth.canAccessMantenimiento();
        const isDeposito = this.auth.getUserOficina()?.toLowerCase().includes('deposito');
        
        // Inspecciones es el dashboard por defecto, a menos que sea una oficina exclusiva de mantenimiento
        const isOnlyMantenimiento = hasMantenimiento && !hasJefatura && !isDeposito && 
            this.auth.getUserOficina()?.trim() === 'Rec. y Entrega';

        this.canAccessDeposito = isDeposito || hasJefatura;
        this.canAccessInspecciones = !isOnlyMantenimiento; 

        let accessCount = 0;
        if (this.canAccessDeposito) accessCount++;
        if (this.canAccessInspecciones) accessCount++;
        if (hasMantenimiento) accessCount++;

        if (accessCount === 1 && !hasJefatura) {
            if (hasMantenimiento && isOnlyMantenimiento) this.router.navigate(['/mantenimiento']);
            else if (this.canAccessDeposito) this.router.navigate(['/deposito']);
            else this.router.navigate(['/dashboard']);
            return;
        }

        this.username = this.auth.getUserName() || 'Comandante';
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

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
