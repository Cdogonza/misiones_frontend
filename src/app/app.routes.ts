import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'dashboard/edit/:type/:id',
        loadComponent: () =>
            import('./features/dashboard/edit-asset/edit-asset.component').then(m => m.EditAssetComponent),
        canActivate: [authGuard]
    },
    {
        path: 'dashboard/full-data/:id',
        loadComponent: () =>
            import('./features/dashboard/full-data/full-data.component').then(m => m.FullDataComponent),
        canActivate: [authGuard]
    },
    {
        path: 'dashboard/profile',
        loadComponent: () =>
            import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
