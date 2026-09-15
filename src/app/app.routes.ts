import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { adminGuard, guestGuard, memberGuard, trainerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShellComponent,
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
