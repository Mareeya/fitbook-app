import { Routes } from '@angular/router';
import { SchedulePageComponent } from './schedule-page/schedule-page.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';

export const scheduleRoutes: Routes = [
  { path: '', component: SchedulePageComponent },
  { path: ':sessionId', component: SessionDetailComponent },
];
