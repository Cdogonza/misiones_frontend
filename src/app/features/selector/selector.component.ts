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

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
