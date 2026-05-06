import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, RegisterRequest } from '../../core/models/user.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    profile: UserProfile = { idusuario: 0, username: '', email: '' };
    newPassword = '';
    confirmPassword = '';
    loading = true;
    saving = false;
    offices: string[] = [];
    isAdmin = false;
    isSuperAdmin = false;

    // Gestión de Pestañas y nuevo usuario
    activeTab: 'edit' | 'register' | 'users' = 'edit';
    users: UserProfile[] = [];
    newUser: RegisterRequest = {
        usuario: '',
        correo: '',
        password: 'Abc123456',
        oficina: '',
        rol: 'integrante'
    };

    // Gestión de edición de usuarios
    editingUser: UserProfile | null = null;
    editUserData = { email: '', rol: '', oficina: '' };

    constructor(
        private auth: AuthService,
        private router: Router,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.loadProfile();
        this.isAdmin = this.auth.isAdmin();
        this.isSuperAdmin = this.auth.isSuperAdmin();
        this.loadOffices();
    }

    loadOffices(): void {
        this.auth.getOficinas().subscribe({
            next: (data) => this.offices = data,
            error: () => console.error('Error loading offices')
        });
    }

    loadProfile(): void {
        this.loading = true;
        this.auth.getProfile().subscribe({
            next: (data) => {
                this.profile = data;
                this.loading = false;
                // Si es admin normal, fijamos su oficina automáticamente
                if (!this.isSuperAdmin && this.profile.oficina) {
                    this.newUser.oficina = this.profile.oficina;
                }
            },
            error: () => {
                alert('Error al cargar perfil.');
                this.loading = false;
            }
        });
    }

    // Lógica para manejar cambios en los checkboxes de rol
    onRoleChange(role: string, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        
        if (role === 'admin') {
            if (checked) {
                // Si marcamos admin, el rol base es admin
                this.newUser.rol = 'admin';
            } else {
                // Si desmarcamos admin, vuelve a integrante (y quita superAdmin si estuviera)
                this.newUser.rol = 'integrante';
            }
        } else if (role === 'superAdmin') {
            if (checked) {
                this.newUser.rol = 'superAdmin';
            } else {
                // Si quitamos superAdmin, vuelve a admin
                this.newUser.rol = 'admin';
            }
        }
    }

    save(): void {
        if (this.newPassword && this.newPassword !== this.confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (!confirm('¿Deseas guardar los cambios en tu perfil?')) return;

        this.saving = true;

        // Si hay una nueva contraseña, actualizamos ambos (o uno tras otro)
        const emailObs = this.auth.updateEmail(this.profile.email);
        const passObs = this.newPassword ? this.auth.updatePassword(this.newPassword) : null;

        if (passObs) {
            emailObs.subscribe({
                next: () => {
                    passObs.subscribe({
                        next: () => this.handleSuccess(),
                        error: (err: any) => this.handleError(err)
                    });
                },
                error: (err: any) => this.handleError(err)
            });
        } else {
            emailObs.subscribe({
                next: () => this.handleSuccess(),
                error: (err: any) => this.handleError(err)
            });
        }
    }

    handleSuccess(): void {
        alert('Perfil actualizado con éxito.');
        this.saving = false;
        this.newPassword = '';
        this.confirmPassword = '';
    }

    registerUser(): void {
        if (!this.newUser.usuario || !this.newUser.correo) {
            alert('Por favor, completa los campos requeridos (Usuario y Correo).');
            return;
        }

        if (!confirm(`¿Estás seguro de crear al usuario "${this.newUser.usuario}"?`)) return;

        this.saving = true;
        this.auth.register(this.newUser).subscribe({
            next: (res) => {
                alert(`Usuario "${res.usuario}" registrado exitosamente con contraseña por defecto.`);
                this.newUser = { 
                    usuario: '', 
                    correo: '', 
                    password: 'Abc123456',
                    oficina: '',
                    rol: 'integrante'
                };
                this.saving = false;
                this.activeTab = 'edit';
            },
            error: (err) => {
                alert('Error al registrar usuario: ' + (err.error?.message || 'Error del servidor'));
                this.saving = false;
            }
        });
    }

    switchTab(tab: 'edit' | 'register' | 'users'): void {
        this.activeTab = tab;
        if (tab === 'users') {
            this.loadUsers();
        }
    }

    loadUsers(): void {
        this.loading = true;
        this.auth.getUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
            },
            error: () => {
                alert('Error al cargar la lista de usuarios.');
                this.loading = false;
            }
        });
    }

    resetUserPassword(user: UserProfile): void {
        if (!confirm(`¿Estás seguro de resetear la contraseña para el usuario "${user.username}"?`)) return;

        this.saving = true;
        this.auth.resetPassword(user.idusuario).subscribe({
            next: () => {
                alert(`Contraseña de "${user.username}" reseteada con éxito.`);
                this.saving = false;
            },
            error: (err) => {
                alert('Error al resetear contraseña: ' + (err.error?.message || 'Error del servidor'));
                this.saving = false;
            }
        });
    }

    // --- NUEVAS FUNCIONES DE GESTIÓN PARA SUPERADMIN ---

    onEditUser(user: UserProfile): void {
        this.editingUser = { ...user };
        this.editUserData = {
            email: user.email || '',
            rol: user.rol || 'integrante',
            oficina: user.oficina || ''
        };
    }

    cancelEdit(): void {
        this.editingUser = null;
    }

    saveUserEdit(): void {
        if (!this.editingUser) return;
        
        this.saving = true;
        this.auth.updateUserAdmin(this.editingUser.idusuario, this.editUserData).subscribe({
            next: () => {
                alert('Usuario actualizado correctamente.');
                this.editingUser = null;
                this.loadUsers();
                this.saving = false;
            },
            error: (err) => {
                alert('Error al actualizar usuario: ' + (err.error?.message || 'Error del servidor'));
                this.saving = false;
            }
        });
    }

    deleteUser(user: UserProfile): void {
        if (!confirm(`¿Estás COMPLETAMENTE seguro de eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;

        this.saving = true;
        this.auth.deleteUser(user.idusuario).subscribe({
            next: () => {
                alert('Usuario eliminado correctamente.');
                this.loadUsers();
                this.saving = false;
            },
            error: (err) => {
                alert('Error al eliminar usuario: ' + (err.error?.message || 'Error del servidor'));
                this.saving = false;
            }
        });
    }

    handleError(err: any): void {
        alert('Error al procesar la solicitud: ' + (err.error?.message || 'Error del servidor'));
        this.saving = false;
    }

    get backLabel(): string {
        return 'Volver';
    }

    goBack(): void {
        this.location.back();
    }
}
