import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { GymClassResponse } from '../classes-page/models/gym-class-response.model';
import { ClassesService } from '../classes-page/services/classes.service';
import { SessionResponse } from '../../sessions/models/session.models';
import { SessionsService } from '../../sessions/services/sessions.service';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import {
  addDays,
  combineDateAndTime,
  formatSessionDateTime,
  splitDateAndTime,
  startOfLocalDay,
  toApiDateTime,
  toExclusiveApiEnd,
} from '../../../shared/helpers/api-datetime';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { TouchedErrorStateMatcher } from '../../../shared/helpers/touched-error-state.matcher';
import { AppValidators } from '../../../shared/validators/app.validators';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sessions-page',
  providers: [{ provide: ErrorStateMatcher, useClass: TouchedErrorStateMatcher }],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonToggleModule,
  ],
  templateUrl: './sessions-page.component.html',
  styleUrl: './sessions-page.component.scss',
})
export class SessionsPageComponent implements OnInit, AfterViewInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly classesService = inject(ClassesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  displayedColumns = ['when', 'className', 'trainerName', 'seats', 'status', 'actions'];
  sessions: SessionResponse[] = [];
  classes: GymClassResponse[] = [];
  editingSessionId: number | null = null;
  isLoading = false;
  isSaving = false;
  loadError = '';
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  /** When not editing, choose single create vs series generate. */
  addMode: 'single' | 'series' = 'single';

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild('sessionFormRef', { read: FormGroupDirective })
  sessionFormRef?: FormGroupDirective;
  @ViewChild('generateFormRef', { read: FormGroupDirective })
  generateFormRef?: FormGroupDirective;

  filterForm = new FormGroup({
    classId: new FormControl<number | null>(null),
    fromDate: new FormControl(startOfLocalDay(new Date()), Validators.required),
    toDate: new FormControl(addDays(startOfLocalDay(new Date()), 14), Validators.required),
  });

  /** Snapshot used for API calls until user clicks Apply. */
  private appliedFilters = {
    classId: null as number | null,
    fromDate: startOfLocalDay(new Date()),
    toDate: addDays(startOfLocalDay(new Date()), 14),
  };

  sessionForm = new FormGroup({
    classId: new FormControl(0, [Validators.required, Validators.min(1)]),
    startDate: new FormControl<Date | null>(null, Validators.required),
    startTime: new FormControl('09:00', Validators.required),
    capacity: new FormControl<number | null>(null, [Validators.min(1), Validators.max(200)]),
  });

  generateForm = new FormGroup({
    classId: new FormControl(0, [Validators.required, Validators.min(1)]),
    startDate: new FormControl<Date | null>(null, Validators.required),
    startTime: new FormControl('09:00', Validators.required),
    untilDate: new FormControl<Date | null>(null, Validators.required),
    repeatEveryDays: new FormControl(7, [Validators.required, Validators.min(1), Validators.max(90)]),
    capacity: new FormControl<number | null>(null, [Validators.min(1), Validators.max(200)]),
  });

  ngOnInit(): void {
    this.loadClasses();
    this.syncAppliedFiltersFromForm();
    this.loadSessions();
  }

  applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.syncAppliedFiltersFromForm();
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    this.loadSessions();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.pageIndex = this.pageIndex;
      this.paginator.pageSize = this.pageSize;
    }
  }

  loadClasses(): void {
    this.classesService.getAll().subscribe({
      next: (items) => {
        this.classes = items;
        const firstId = items[0]?.id ?? 0;
        this.sessionForm.patchValue({ classId: firstId });
        this.generateForm.patchValue({ classId: firstId });
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, apiErrorMessage(error, 'Cannot load classes.'), 'error');
      },
    });
  }

  loadSessions(): void {
    const fromDate = this.appliedFilters.fromDate;
    const toDate = this.appliedFilters.toDate;
    if (!fromDate || !toDate) {
      return;
    }

    if (toDate < fromDate) {
      showAppSnack(this.snackBar, 'End date must be on or after start date.', 'error');
      return;
    }

    const classId = this.appliedFilters.classId;

    this.isLoading = true;
    this.loadError = '';

    this.sessionsService
      .getAll({
        from: toApiDateTime(startOfLocalDay(fromDate)),
        to: toExclusiveApiEnd(toDate),
        classId: classId ?? undefined,
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (page) => {
          this.sessions = page.items;
          this.total = page.total;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Cannot load sessions.');
          showAppSnack(this.snackBar, this.loadError, 'error');
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSessions();
  }

  whenLabels(session: SessionResponse): { dateLabel: string; timeLabel: string } {
    return formatSessionDateTime(session.startAt);
  }

  isCancelled(session: SessionResponse): boolean {
    return session.statusName.toLowerCase() === 'cancelled';
  }

  saveSession(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    const raw = this.sessionForm.getRawValue();
    if (!raw.startDate) {
      return;
    }

    const payload = {
      classId: Number(raw.classId),
      startAt: combineDateAndTime(raw.startDate, raw.startTime || '09:00'),
      capacity: raw.capacity ? Number(raw.capacity) : null,
    };

    if (this.editingSessionId !== null) {
      this.updateSession(this.editingSessionId, payload);
      return;
    }

    this.createSession(payload);
  }

  generateSessions(): void {
    if (this.generateForm.invalid) {
      this.generateForm.markAllAsTouched();
      return;
    }

    const raw = this.generateForm.getRawValue();
    if (!raw.startDate || !raw.untilDate) {
      return;
    }

    this.isSaving = true;

    this.sessionsService
      .generate({
        classId: Number(raw.classId),
        startAt: combineDateAndTime(raw.startDate, raw.startTime || '09:00'),
        untilAt: combineDateAndTime(raw.untilDate, '23:59'),
        repeatEveryDays: Number(raw.repeatEveryDays),
        capacity: raw.capacity ? Number(raw.capacity) : null,
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (created) => {
          showAppSnack(this.snackBar, `${created.length} session(s) ready.`);
          this.resetGenerateForm();
          this.loadSessions();
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not generate sessions.'), 'error');
        },
      });
  }

  editSession(session: SessionResponse): void {
    this.editingSessionId = session.id;
    const { date, time } = splitDateAndTime(session.startAt);
    this.sessionForm.setValue({
      classId: session.classId,
      startDate: date,
      startTime: time,
      capacity: session.capacity,
    });
    this.sessionForm.markAsPristine();
    this.sessionForm.markAsUntouched();
  }

  cancelEdit(): void {
    this.resetSessionForm();
  }

  cancelSession(session: SessionResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Cancel session',
        message: `Cancel ${session.className} on ${this.whenLabels(session).dateLabel}?`,
        confirmText: 'Cancel session',
        cancelText: 'Keep',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.sessionsService.cancel(session.id).subscribe({
        next: () => {
          showAppSnack(this.snackBar, 'Session cancelled.');
          this.loadSessions();
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not cancel session.'), 'error');
        },
      });
    });
  }

  setAddMode(mode: 'single' | 'series' | null | undefined): void {
    if (mode === 'single' || mode === 'series') {
      this.addMode = mode;
    }
  }

  private createSession(payload: { classId: number; startAt: string; capacity: number | null }): void {
    this.isSaving = true;
    this.sessionsService
      .create(payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          showAppSnack(this.snackBar, 'Session created.');
          this.resetSessionForm();
          this.loadSessions();
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not create session.'), 'error');
        },
      });
  }

  private updateSession(
    id: number,
    payload: { classId: number; startAt: string; capacity: number | null },
  ): void {
    this.isSaving = true;
    this.sessionsService
      .update(id, payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          showAppSnack(this.snackBar, 'Session updated.');
          this.resetSessionForm();
          this.loadSessions();
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not update session.'), 'error');
        },
      });
  }

  private resetSessionForm(): void {
    this.editingSessionId = null;
    AppValidators.resetForm(this.sessionForm, this.defaultSessionValues(), this.sessionFormRef);
  }

  private resetGenerateForm(): void {
    AppValidators.resetForm(this.generateForm, this.defaultGenerateValues(), this.generateFormRef);
  }

  private defaultSessionValues() {
    return {
      classId: this.classes[0]?.id ?? 0,
      startDate: null as Date | null,
      startTime: '09:00',
      capacity: null as number | null,
    };
  }

  private defaultGenerateValues() {
    return {
      classId: this.classes[0]?.id ?? 0,
      startDate: null as Date | null,
      startTime: '09:00',
      untilDate: null as Date | null,
      repeatEveryDays: 7,
      capacity: null as number | null,
    };
  }

  private syncAppliedFiltersFromForm(): void {
    const raw = this.filterForm.getRawValue();
    this.appliedFilters = {
      classId: raw.classId ?? null,
      fromDate: raw.fromDate ?? startOfLocalDay(new Date()),
      toDate: raw.toDate ?? addDays(startOfLocalDay(new Date()), 14),
    };
  }
}
