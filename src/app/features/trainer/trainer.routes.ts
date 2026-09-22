import { Routes } from '@angular/router';
import { trainerGuard } from '../../core/guards/auth.guard';
import { AttendancePageComponent } from '../attendance/attendance-page/attendance-page.component';
import { MyClassesComponent } from './my-classes/my-classes.component';
import { TrainerSessionsComponent } from './trainer-sessions/trainer-sessions.component';

export const trainerRoutes: Routes = [
  { path: '', component: MyClassesComponent },
  { path: 'sessions', component: TrainerSessionsComponent },
  {
    path: 'sessions/:id/roster',
    canActivate: [trainerGuard],
    component: AttendancePageComponent,
  },
];
