import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { BookingResponse } from '../../bookings/models/booking.models';
import { BookingsService } from '../../bookings/services/bookings.service';
import { SessionResponse } from '../../sessions/models/session.models';
import { SessionsService } from '../../sessions/services/sessions.service';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import {
  addDays,
  formatSessionDateTime,
  startOfLocalDay,
  toApiDateTime,
  toExclusiveApiEnd,
} from '../../../shared/helpers/api-datetime';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../auth/services/auth.service';

export type SessionAvailability = 'available' | 'booked' | 'full' | 'past';

@Component({
  selector: 'app-browse-sessions',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './browse-sessions.component.html',
  styleUrl: './browse-sessions.component.scss',
})
export class BrowseSessionsComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.currentUser;
  searchControl = new FormControl('', { nonNullable: true });
  dateRangeForm = new FormGroup({
    fromDate: new FormControl(startOfLocalDay(new Date()), Validators.required),
    toDate: new FormControl(addDays(startOfLocalDay(new Date()), 30), Validators.required),
  });

  /** Used for API + client search until Apply is clicked. */
  private appliedFromDate = startOfLocalDay(new Date());
  private appliedToDate = addDays(startOfLocalDay(new Date()), 30);
  appliedSearchTerm = '';

  sessions: SessionResponse[] = [];
  bookedSessionIds = new Set<number>();
  upcomingBookingsCount = 0;
  isLoading = false;
  bookingSessionId: number | null = null;
  loadError = '';
  total = 0;
  pageIndex = 0;
  pageSize = 12;

  ngOnInit(): void {
    this.syncAppliedFromForm();
    this.loadSessions();
  }

  applyFilters(): void {
    if (this.dateRangeForm.invalid) {
      this.dateRangeForm.markAllAsTouched();
      return;
    }

    this.syncAppliedFromForm();
    this.pageIndex = 0;
    this.loadSessions();
  }

  get firstName(): string {
    return this.user()?.name?.split(' ')[0] ?? 'there';
  }

  get filteredSessions(): SessionResponse[] {
    const term = this.appliedSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.sessions;
    }

    return this.sessions.filter(
      (session) =>
        session.className.toLowerCase().includes(term) ||
        session.trainerName.toLowerCase().includes(term) ||
        session.categoryName.toLowerCase().includes(term),
    );
  }

  loadSessions(): void {
    const fromDate = this.appliedFromDate;
    const toDate = this.appliedToDate;
    if (!fromDate || !toDate) {
      return;
    }

    if (toDate < fromDate) {
      showAppSnack(this.snackBar, 'End date must be on or after start date.', 'error');
      return;
    }

    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      sessions: this.sessionsService.getAll({
        from: toApiDateTime(startOfLocalDay(fromDate)),
        to: toExclusiveApiEnd(toDate),
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }),
      bookings: this.bookingsService.getMine({ pageSize: 200 }),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ sessions, bookings }) => {
          this.applyMyBookings(bookings.items);
          this.sessions = sessions.items.filter((s) => s.statusName.toLowerCase() !== 'cancelled');
          this.total = sessions.total;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Cannot load sessions.');
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSessions();
  }

  labels(session: SessionResponse): { dateLabel: string; timeLabel: string } {
    return formatSessionDateTime(session.startAt);
  }

  availability(session: SessionResponse): SessionAvailability {
    if (this.bookedSessionIds.has(session.id)) {
      return 'booked';
    }

    if (session.seatsLeft <= 0) {
      return 'full';
    }

    if (new Date(session.startAt) <= new Date()) {
      return 'past';
    }

    return 'available';
  }

  statusLabel(session: SessionResponse): string {
    const state = this.availability(session);
    if (state === 'booked') {
      return 'Booked';
    }

    if (state === 'full') {
      return 'Full';
    }

    if (state === 'past') {
      return 'Started';
    }

    return 'Open';
  }

  fillPercent(session: SessionResponse): number {
    if (session.capacity <= 0) {
      return 0;
    }

    return Math.round((session.seatsTaken / session.capacity) * 100);
  }

  bookSession(session: SessionResponse): void {
    if (this.availability(session) !== 'available') {
      return;
    }

    const { dateLabel, timeLabel } = this.labels(session);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Confirm booking',
        message: `${session.className} with ${session.trainerName} on ${dateLabel} at ${timeLabel}?`,
        confirmText: 'Book now',
        cancelText: 'Go back',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.bookingSessionId = session.id;
      this.bookingsService
        .book(session.id)
        .pipe(
          finalize(() => {
            this.bookingSessionId = null;
          }),
        )
        .subscribe({
          next: () => {
            this.bookedSessionIds.add(session.id);
            this.upcomingBookingsCount += 1;
            showAppSnack(this.snackBar, 'You are booked in. See My bookings anytime.');
            this.loadSessions();
          },
          error: (error: HttpErrorResponse) => {
            showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not book this session.'), 'error');
          },
        });
    });
  }

  isBookingSession(sessionId: number): boolean {
    return this.bookingSessionId === sessionId;
  }

  private syncAppliedFromForm(): void {
    const raw = this.dateRangeForm.getRawValue();
    this.appliedFromDate = raw.fromDate ?? startOfLocalDay(new Date());
    this.appliedToDate = raw.toDate ?? addDays(startOfLocalDay(new Date()), 30);
    this.appliedSearchTerm = this.searchControl.value;
  }

  private applyMyBookings(bookings: BookingResponse[]): void {
    this.bookedSessionIds.clear();
    this.upcomingBookingsCount = 0;
    const now = Date.now();

    for (const booking of bookings) {
      if (booking.bookingStatus.toLowerCase() === 'cancelled') {
        continue;
      }

      this.bookedSessionIds.add(booking.sessionId);
      if (new Date(booking.startAt).getTime() >= now) {
        this.upcomingBookingsCount += 1;
      }
    }
  }
}
