import { Routes } from '@angular/router';
import { TrainersPageComponent } from './trainers-page/trainers-page.component';
import { ClassesPageComponent } from './classes-page/classes-page.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SessionsPageComponent } from './sessions-page/sessions-page.component';

export const adminRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'trainers', component: TrainersPageComponent },
  { path: 'classes', component: ClassesPageComponent },
  { path: 'sessions', component: SessionsPageComponent },
];
