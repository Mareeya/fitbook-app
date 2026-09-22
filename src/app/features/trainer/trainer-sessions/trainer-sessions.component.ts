import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
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
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-trainer-sessions',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './trainer-sessions.component.html',
  styleUrl: './trainer-sessions.component.scss',
})
export class TrainerSessionsComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  dateRangeForm = new FormGroup({
    fromDate: new FormControl(startOfLocalDay(new Date()), Validators.required),
    toDate: new FormControl(addDays(startOfLocalDay(new Date()), 30), Validators.required),
  });

  private appliedFromDate = startOfLocalDay(new Date());
  private appliedToDate = addDays(startOfLocalDay(new Date()), 30);

  displayedColumns = ['when', 'className', 'seats', 'status', 'actions'];
  sessions: SessionResponse[] = [];
  isLoading = false;
  loadError = '';

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
    this.loadSessions();
  }

  loadSessions(): void {
    const trainerId = this.authService.getUser()?.trainerId;
    if (!trainerId) {
      this.loadError = 'Your trainer profile is not linked yet. Ask an admin to link your user account.';
      return;
    }

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

    this.sessionsService
      .getAll({
        from: toApiDateTime(startOfLocalDay(fromDate)),
        to: toExclusiveApiEnd(toDate),
        trainerId,
        pageSize: 100,
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (page) => {
          this.sessions = page.items;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Cannot load sessions.');
          showAppSnack(this.snackBar, this.loadError, 'error');
        },
      });
  }

  whenLabels(session: SessionResponse): string {
    const { dateLabel, timeLabel } = formatSessionDateTime(session.startAt);
    return `${dateLabel} · ${timeLabel}`;
  }

  private syncAppliedFromForm(): void {
    const raw = this.dateRangeForm.getRawValue();
    this.appliedFromDate = raw.fromDate ?? startOfLocalDay(new Date());
    this.appliedToDate = raw.toDate ?? addDays(startOfLocalDay(new Date()), 30);
  }
}
