import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';
import { adminGuard, authGuard, guestGuard, memberGuard, trainerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'trainer',
        canActivate: [trainerGuard],
        loadChildren: () =>
          import('./features/trainer/trainer.routes').then((m) => m.trainerRoutes),
      },
      {
        path: 'home',
        canActivate: [memberGuard],
        loadChildren: () =>
          import('./features/member/member.routes').then((m) => m.memberRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
