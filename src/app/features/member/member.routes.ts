import { Routes } from '@angular/router';
import { BrowseSessionsComponent } from './browse-sessions/browse-sessions.component';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';

export const memberRoutes: Routes = [
  { path: '', component: BrowseSessionsComponent },
  { path: 'bookings', component: MyBookingsComponent },
];
