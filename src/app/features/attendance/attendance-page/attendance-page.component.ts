import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ATTENDANCE_STATUS_LABELS,
  AttendanceStatus,
} from '../../sessions/models/attendance-status.enum';
import { RosterEntryResponse, SessionRosterResponse } from '../../sessions/models/session.models';
import { SessionsService } from '../../sessions/services/sessions.service';
import { AttendanceService } from '../services/attendance.service';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { formatSessionDateTime } from '../../../shared/helpers/api-datetime';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
const STATUS_FROM_API: Record<string, AttendanceStatus> = {
  Booked: AttendanceStatus.Booked,
  Attended: AttendanceStatus.Attended,
  NoShow: AttendanceStatus.NoShow,
  LateCancel: AttendanceStatus.LateCancel,
};

@Component({
  selector: 'app-attendance-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './attendance-page.component.html',
  styleUrl: './attendance-page.component.scss',
})
export class AttendancePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionsService = inject(SessionsService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusOptions = [
    AttendanceStatus.Attended,
    AttendanceStatus.NoShow,
    AttendanceStatus.Booked,
    AttendanceStatus.LateCancel,
  ];

  readonly statusLabels = ATTENDANCE_STATUS_LABELS;
  displayedColumns = ['memberName', 'email', 'bookingStatus', 'attendanceStatus', 'mark'];
  roster: SessionRosterResponse | null = null;
  rowForms = new Map<number, FormGroup<{ status: FormControl<AttendanceStatus> }>>();
  isLoading = false;
  isSaving = false;
  loadError = '';
  sessionId = 0;

  readonly backLink = '/trainer/sessions';

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.sessionId) {
      this.loadError = 'Session was not found.';
      return;
    }

    this.loadRoster();
  }

  loadRoster(): void {
    this.isLoading = true;
    this.loadError = '';

    this.sessionsService
      .getRoster(this.sessionId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (roster) => {
          this.roster = roster;
          this.buildRowForms(roster.entries);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Cannot load roster.');
          showAppSnack(this.snackBar, this.loadError, 'error');
        },
      });
  }

  whenLabel(): string {
    if (!this.roster?.session.startAt) {
      return '';
    }

    const { dateLabel, timeLabel } = formatSessionDateTime(this.roster.session.startAt);
    return `${dateLabel} · ${timeLabel}`;
  }

  canMarkAttendance(): boolean {
    const startAt = this.roster?.session.startAt;
    if (!startAt) {
      return false;
    }

    return new Date(startAt).getTime() <= Date.now();
  }

  saveAttendance(): void {
    if (!this.roster) {
      return;
    }

    if (!this.canMarkAttendance()) {
      showAppSnack(this.snackBar, 'Attendance opens when the session starts.', 'error');
      return;
    }

    const marks = this.roster.entries
      .filter((entry) => entry.bookingStatus.toLowerCase() !== 'cancelled')
      .map((entry) => ({
        bookingId: entry.bookingId,
        status: this.rowForms.get(entry.bookingId)?.controls.status.value ?? AttendanceStatus.Booked,
      }));

    if (marks.length === 0) {
      showAppSnack(this.snackBar, 'No active bookings to mark.', 'error');
      return;
    }

    this.isSaving = true;
    this.attendanceService
      .markSession(this.sessionId, { marks })
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (updated) => {
          this.roster = updated;
          this.buildRowForms(updated.entries);
          showAppSnack(this.snackBar, 'Attendance saved.');
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not save attendance.'), 'error');
        },
      });
  }

  rowForm(entry: RosterEntryResponse): FormGroup<{ status: FormControl<AttendanceStatus> }> {
    return this.rowForms.get(entry.bookingId)!;
  }

  private buildRowForms(entries: RosterEntryResponse[]): void {
    this.rowForms.clear();
    for (const entry of entries) {
      const status = STATUS_FROM_API[entry.attendanceStatus] ?? AttendanceStatus.Booked;
      this.rowForms.set(
        entry.bookingId,
        new FormGroup({
          status: new FormControl(status, { nonNullable: true }),
        }),
      );
    }
  }
}
