import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./features/member/member.routes').then((m) => m.memberRoutes),
      },
      {
        path: 'schedule',
        loadChildren: () =>
          import('./features/schedule/schedule.routes').then((m) => m.scheduleRoutes),
      },
      {
        path: 'my-bookings',
        loadChildren: () =>
          import('./features/my-bookings/my-bookings.routes').then((m) => m.myBookingsRoutes),
      },
      {
        path: 'staff',
        loadChildren: () =>
          import('./features/staff/staff.routes').then((m) => m.staffRoutes),
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },
];
