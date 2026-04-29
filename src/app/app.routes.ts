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
        path: 'selector',
        loadComponent: () =>
            import('./features/selector/selector.component').then(m => m.SelectorComponent),
        canActivate: [authGuard]
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
        path: 'deposito',
        loadComponent: () =>
            import('./features/deposito/deposito.component').then(m => m.DepositoComponent),
        canActivate: [authGuard]
    },
    {
        path: 'deposito/pedido',
        loadComponent: () =>
            import('./features/deposito/pedido/pedido.component').then(m => m.PedidoComponent),
        canActivate: [authGuard]
    },
    {
        path: 'deposito/gestion',
        loadComponent: () =>
            import('./features/deposito/gestion-pedidos/gestion-pedidos.component').then(m => m.GestionPedidosComponent),
        canActivate: [authGuard]
    },
    {
        path: 'mantenimiento',
        loadComponent: () =>
            import('./features/mantenimiento/mantenimiento.component').then(m => m.MantenimientoComponent),
        canActivate: [authGuard]
    },
    {
        path: 'mantenimiento/sala-i',
        loadComponent: () =>
            import('./features/mantenimiento/salas/sala-i/sala-i.component').then(m => m.SalaIComponent),
        canActivate: [authGuard]
    },
    {
        path: 'repuestos',
        loadComponent: () =>
            import('./features/repuestos/repuestos.component').then(m => m.RepuestosComponent),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
