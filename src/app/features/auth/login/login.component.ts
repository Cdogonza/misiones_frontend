import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    form: FormGroup;
    loading = false;
    errorMsg = '';
    showPassword = false;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router
    ) {
        this.form = this.fb.group({
            usuario: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get usuario() { return this.form.get('usuario')!; }
    get password() { return this.form.get('password')!; }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.errorMsg = '';

        this.auth.login(this.form.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loading = false;
                if (err.status === 401) {
                    this.errorMsg = 'Usuario o contraseña incorrectos.';
                } else {
                    this.errorMsg = 'Error al conectar con el servidor. Intentá de nuevo.';
                }
            }
        });
    }
}
