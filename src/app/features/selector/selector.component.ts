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
    showSalasDropdown = false;

    salas = [
        { name: 'SALA I', path: '/mantenimiento/sala-i' },
        { name: 'SALA II', path: '/mantenimiento/sala-ii' },
        { name: 'SALA III', path: '/mantenimiento/sala-iii' },
        { name: 'SALA IV', path: '/mantenimiento/sala-iv' },
        { name: 'SALA V Telef.', path: '/mantenimiento/sala-v-telef' },
        { name: 'SALA V Infca.', path: '/mantenimiento/sala-v-infca' }
    ];

    constructor(private auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        // Si no es jefatura ni superadmin, redirigir según su perfil
        if (!this.auth.isJefatura() && !this.auth.isSuperAdmin()) {
            const oficina = this.auth.getUserOficina() || '';
            
            if (oficina.toLowerCase().includes('deposito')) {
                this.router.navigate(['/deposito']);
                return;
            } 
            
            if (this.auth.canAccessMantenimiento()) {
                const userSala = this.salas.find(s => oficina.includes(s.name));
                if (userSala) {
                    this.router.navigate([userSala.path]);
                } else {
                    this.router.navigate(['/mantenimiento']);
                }
                return;
            }

            this.router.navigate(['/dashboard']);
            return;
        }
        const hasJefatura = this.auth.isJefatura();
        const isAdmin = this.auth.isAdmin();
        const hasMantenimiento = this.auth.canAccessMantenimiento();
        const oficina = this.auth.getUserOficina() || '';
        const isDeposito = oficina.toLowerCase().includes('deposito');
        
        // Determinar si es una oficina específica
        const isRecYEntrega = oficina.toLowerCase().includes('rec. y entrega');
        
        // Buscar si el usuario pertenece a alguna sala
        const userSala = this.salas.find(s => oficina.includes(s.name));

        // Inspecciones es el dashboard por defecto, a menos que sea una oficina exclusiva
        const isOnlyMantenimiento = hasMantenimiento && !hasJefatura && !isDeposito && !isAdmin;

        this.canAccessDeposito = isDeposito || hasJefatura || this.auth.isSuperAdmin();
        this.canAccessInspecciones = hasJefatura || this.auth.isSuperAdmin(); 

        // Conteo de accesos para redirección automática
        let accessCount = 0;
        if (this.canAccessDeposito) accessCount++;
        if (this.canAccessInspecciones) accessCount++;
        if (isRecYEntrega || userSala || hasJefatura || this.auth.isSuperAdmin()) accessCount++;

        // Autorendirección si solo tiene un acceso
        if (accessCount === 1 && !hasJefatura && !this.auth.isSuperAdmin()) {
            if (isDeposito) {
                this.router.navigate(['/deposito']);
            }
            else if (isRecYEntrega) {
                this.router.navigate(['/mantenimiento']);
            }
            else if (userSala) {
                this.router.navigate([userSala.path]);
            }
            else {
                this.router.navigate(['/dashboard']);
            }
            return;
        }
        this.username = this.auth.getUserName() || 'Comandante';
    }

    canSeeMainMantenimiento(): boolean {
        const oficina = this.auth.getUserOficina() || '';
        const isSuperAdmin = this.auth.isSuperAdmin();
        const hasJefatura = this.auth.isJefatura();
        
        // Rec. y Entrega y Salas ven el botón de Mantenimiento (o sus subsecciones)
        const isSala = this.salas.some(s => oficina.includes(s.name));
        return oficina.toLowerCase().includes('rec. y entrega') || isSala || hasJefatura || isSuperAdmin;
    }

    canSeeSala(salaName: string): boolean {
        const oficina = this.auth.getUserOficina() || '';
        const isSuperAdmin = this.auth.isSuperAdmin();
        const hasJefatura = this.auth.isJefatura();
        
        // Admin de una oficina solo ve su oficina
        const isAdminOfThisSala = this.auth.isAdmin() && oficina.includes(salaName);
        
        return oficina.includes(salaName) || hasJefatura || isSuperAdmin;
    }

    hasAnySalaAccess(): boolean {
        return this.salas.some(s => this.canSeeSala(s.name));
    }

    toggleSalas(): void {
        this.showSalasDropdown = !this.showSalasDropdown;
    }

    goToInspecciones(): void {
        this.router.navigate(['/dashboard']);
    }

    goToDeposito(): void {
        this.router.navigate(['/deposito']);
    }

    goToMantenimiento(): void {
        const oficina = this.auth.getUserOficina() || '';
        const userSala = this.salas.find(s => oficina.includes(s.name));
        
        if (userSala && !this.auth.isJefatura() && !this.auth.isSuperAdmin()) {
            this.router.navigate([userSala.path]);
        } else {
            this.router.navigate(['/mantenimiento']);
        }
    }

    goToSala(path: string): void {
        this.router.navigate([path]);
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
