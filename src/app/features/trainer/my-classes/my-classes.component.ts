import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { GymClassResponse } from '../../admin/classes-page/models/gym-class-response.model';
import { ClassesService } from '../../admin/classes-page/services/classes.service';
import { SessionResponse } from '../../sessions/models/session.models';
import { SessionsService } from '../../sessions/services/sessions.service';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { startOfLocalDay, toApiDateTime, toExclusiveApiEnd } from '../../../shared/helpers/api-datetime';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-my-classes',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './my-classes.component.html',
  styleUrl: './my-classes.component.scss',
})
export class MyClassesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classesService = inject(ClassesService);
  private readonly sessionsService = inject(SessionsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly user = this.authService.currentUser;
  classes: GymClassResponse[] = [];
  todaySessions: SessionResponse[] = [];
  isLoading = false;
  loadError = '';
  todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  get firstName(): string {
    return this.user()?.name?.split(' ')[0] ?? '';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 17) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  get assignedCount(): number {
    return this.classes.length;
  }

  get sessionsThisMonth(): number {
    return this.classes.reduce((sum, gymClass) => sum + gymClass.sessionsThisMonth, 0);
  }

  get averageFillRate(): number {
    const withSessions = this.classes.filter((gymClass) => gymClass.sessionsThisMonth > 0);
    if (withSessions.length === 0) {
      return 0;
    }

    const total = withSessions.reduce((sum, gymClass) => sum + gymClass.averageFillRate, 0);
    return Math.round(total / withSessions.length);
  }

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    const userId = this.user()?.id;
    const trainerId = this.authService.getUser()?.trainerId;
    if (!userId) {
      return;
    }

    if (!trainerId) {
      this.loadError = 'Your trainer profile is not linked yet. Ask an admin to link your account.';
      return;
    }

    const today = startOfLocalDay(new Date());
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      classes: this.classesService.getByTrainerUser(userId),
      sessions: this.sessionsService.getAll({
        from: toApiDateTime(today),
        to: toExclusiveApiEnd(today),
        trainerId,
        pageSize: 50,
      }),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ classes, sessions }) => {
          this.classes = classes;
          this.todaySessions = sessions.items
            .filter((session) => session.statusName.toLowerCase() !== 'cancelled')
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Could not load trainer overview.');
          showAppSnack(this.snackBar, this.loadError, 'error');
        },
      });
  }

  fillRate(session: SessionResponse): number {
    if (session.capacity <= 0) {
      return 0;
    }

    return Math.round((session.seatsTaken / session.capacity) * 100);
  }

  isSessionFull(session: SessionResponse): boolean {
    return session.seatsLeft <= 0;
  }

  isSessionLowFill(session: SessionResponse): boolean {
    return this.fillRate(session) < 40;
  }
}
