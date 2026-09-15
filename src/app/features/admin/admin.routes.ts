import { Routes } from '@angular/router';
import { TrainersPageComponent } from './trainers-page/trainers-page.component';
import { ClassesPageComponent } from './classes-page/classes-page.component';

export const adminRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'trainers' },
  { path: 'trainers', component: TrainersPageComponent },
  { path: 'classes', component: ClassesPageComponent },
];
