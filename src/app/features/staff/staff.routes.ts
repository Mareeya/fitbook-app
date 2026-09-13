import { Routes } from '@angular/router';
import { StaffDeskComponent } from './staff-desk/staff-desk.component';
import { RosterComponent } from './roster/roster.component';
import { SessionFormComponent } from './session-form/session-form.component';

export const staffRoutes: Routes = [
  { path: '', component: StaffDeskComponent },
  { path: 'sessions/new', component: SessionFormComponent },
  { path: 'sessions/:id', component: RosterComponent },
  { path: 'sessions/:id/edit', component: SessionFormComponent },
];
