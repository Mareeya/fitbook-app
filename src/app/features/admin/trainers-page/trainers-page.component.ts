import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { AppValidators } from '../../../shared/validators/app.validators';
import { finalize } from 'rxjs';
import { TrainerRequest } from './models/trainer-request.model';
import { TrainerResponse } from './models/trainer-response.model';
import { TrainersService } from './services/trainers.service';

@Component({
  selector: 'app-trainers-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './trainers-page.component.html',
  styleUrl: './trainers-page.component.scss',
})
export class TrainersPageComponent implements OnInit, AfterViewInit {
  private readonly trainersService = inject(TrainersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns = ['name', 'email', 'specialty', 'actions'];
  dataSource = new MatTableDataSource<TrainerResponse>([]);
  editingTrainerId: number | null = null;
  isLoading = false;
  isSaving = false;
  loadError = '';
  hidePassword = true;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(FormGroupDirective) formDirective?: FormGroupDirective;

  trainerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120), AppValidators.personName]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(256)]),
    password: new FormControl('', [Validators.maxLength(100), AppValidators.optionalPassword]),
    specialty: new FormControl('', [Validators.required, Validators.maxLength(80), AppValidators.label]),
  });

  ngOnInit(): void {
    this.loadTrainers();
  }

  ngAfterViewInit(): void {
    this.connectTable();
  }

  loadTrainers(): void {
    this.isLoading = true;
    this.loadError = '';

    this.trainersService.getAll().pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: (trainers) => {
        this.dataSource.data = trainers;
        queueMicrotask(() => this.connectTable());
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = this.getErrorMessage(error);
        showAppSnack(this.snackBar, this.loadError, 'error');
      },
    });
  }

  saveTrainer(): void {
    const formValue = this.trainerForm.value;
    const password = (formValue.password || '').trim();

    if (this.editingTrainerId === null && !password) {
      this.trainerForm.controls.password.markAsTouched();
    }

    if (this.trainerForm.invalid || (this.editingTrainerId === null && !password)) {
      this.trainerForm.markAllAsTouched();
      return;
    }

    const request: TrainerRequest = {
      name: (formValue.name || '').trim(),
      email: (formValue.email || '').trim(),
      password,
      specialty: (formValue.specialty || '').trim(),
    };

    if (this.editingTrainerId !== null) {
      this.updateTrainer(this.editingTrainerId, request);
      return;
    }

    this.createTrainer(request);
  }

  editTrainer(trainer: TrainerResponse): void {
    this.editingTrainerId = trainer.id;
    this.hidePassword = true;
    this.trainerForm.setValue({
      name: trainer.name,
      email: trainer.email,
      password: '',
      specialty: trainer.specialty,
    });
    this.trainerForm.markAsPristine();
    this.trainerForm.markAsUntouched();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteTrainer(trainer: TrainerResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Delete trainer',
        message: `Delete ${trainer.name}? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.trainersService.delete(trainer.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter((item) => item.id !== trainer.id);
          showAppSnack(this.snackBar, 'Trainer deleted successfully.');
          if (this.editingTrainerId === trainer.id) {
            this.resetForm();
          }
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, this.getErrorMessage(error), 'error');
        },
      });
    });
  }

  private createTrainer(request: TrainerRequest): void {
    this.isSaving = true;

    this.trainersService.create(request).pipe(
      finalize(() => {
        this.isSaving = false;
      }),
    ).subscribe({
      next: (trainer) => {
        this.dataSource.data = [...this.dataSource.data, trainer];
        showAppSnack(this.snackBar, 'Trainer added successfully.');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, this.getErrorMessage(error), 'error');
      },
    });
  }

  private updateTrainer(id: number, request: TrainerRequest): void {
    this.isSaving = true;

    this.trainersService.update(id, request).pipe(
      finalize(() => {
        this.isSaving = false;
      }),
    ).subscribe({
      next: (updatedTrainer) => {
        this.dataSource.data = this.dataSource.data.map((trainer) =>
          trainer.id === id ? updatedTrainer : trainer,
        );
        showAppSnack(this.snackBar, 'Trainer updated successfully.');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, this.getErrorMessage(error), 'error');
      },
    });
  }

  private resetForm(): void {
    this.editingTrainerId = null;
    this.hidePassword = true;
    const blank = {
      name: '',
      email: '',
      password: '',
      specialty: '',
    };
    AppValidators.resetForm(this.trainerForm, blank, this.formDirective);
  }

  private connectTable(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409 && typeof error.error !== 'string') {
      return 'This trainer is assigned to a class and cannot be deleted.';
    }

    return apiErrorMessage(error, 'Something went wrong. Please try again.');
  }
}
