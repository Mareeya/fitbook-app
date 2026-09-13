import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { TrainersPageComponent } from './trainers-page/trainers-page.component';
import { ClassesPageComponent } from './classes-page/classes-page.component';
import { UsersPageComponent } from './users-page/users-page.component';

export const adminRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'trainers', component: TrainersPageComponent },
  { path: 'classes', component: ClassesPageComponent },
  { path: 'users', component: UsersPageComponent },
];
