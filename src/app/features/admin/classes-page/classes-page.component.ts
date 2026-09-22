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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { AppValidators } from '../../../shared/validators/app.validators';
import { finalize } from 'rxjs';
import { TrainerResponse } from '../trainers-page/models/trainer-response.model';
import { TrainersService } from '../trainers-page/services/trainers.service';
import { GymClassRequest } from './models/gym-class-request.model';
import { GymClassResponse } from './models/gym-class-response.model';
import { LookupResponse } from './models/lookup-response.model';
import { ClassesService } from './services/classes.service';
import { LookupsService } from './services/lookups.service';

@Component({
  selector: 'app-classes-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './classes-page.component.html',
  styleUrl: './classes-page.component.scss',
})
export class ClassesPageComponent implements OnInit, AfterViewInit {
  private readonly classesService = inject(ClassesService);
  private readonly trainersService = inject(TrainersService);
  private readonly lookupsService = inject(LookupsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns = ['name', 'categoryName', 'trainerName', 'initCapacity', 'averageFillRate', 'actions'];
  dataSource = new MatTableDataSource<GymClassResponse>([]);
  trainers: TrainerResponse[] = [];
  categories: LookupResponse[] = [];
  editingClassId: number | null = null;
  isLoading = false;
  isSaving = false;
  loadError = '';

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(FormGroupDirective) formDirective?: FormGroupDirective;

  classForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(80), AppValidators.label]),
    categoryId: new FormControl(0, [Validators.required, Validators.min(1)]),
    trainerId: new FormControl(0, [Validators.required, Validators.min(1)]),
    initCapacity: new FormControl(10, [Validators.required, Validators.min(1), Validators.max(200)]),
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadTrainers();
    this.loadClasses();
  }

  ngAfterViewInit(): void {
    this.connectTable();
  }

  loadClasses(): void {
    this.isLoading = true;
    this.loadError = '';

    this.classesService.getAll().pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: (classes) => {
        this.dataSource.data = classes;
        queueMicrotask(() => this.connectTable());
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = apiErrorMessage(error, 'Cannot load classes.');
        showAppSnack(this.snackBar, this.loadError, 'error');
      },
    });
  }

  loadCategories(): void {
    this.lookupsService.getByType('class').subscribe({
      next: (categories) => {
        this.categories = categories;
        this.classForm.patchValue({ categoryId: categories[0]?.id ?? 0 });
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, apiErrorMessage(error, 'Cannot load categories.'), 'error');
      },
    });
  }

  loadTrainers(): void {
    this.trainersService.getAll().subscribe({
      next: (trainers) => {
        this.trainers = trainers;
        this.classForm.patchValue({ trainerId: trainers[0]?.id ?? 0 });
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, apiErrorMessage(error, 'Cannot load trainers.'), 'error');
      },
    });
  }

  saveClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    const formValue = this.classForm.value;
    const request: GymClassRequest = {
      name: (formValue.name || '').trim(),
      categoryId: Number(formValue.categoryId),
      trainerId: Number(formValue.trainerId),
      initCapacity: Number(formValue.initCapacity),
    };

    if (this.editingClassId !== null) {
      this.updateClass(this.editingClassId, request);
      return;
    }

    this.createClass(request);
  }

  editClass(gymClass: GymClassResponse): void {
    this.editingClassId = gymClass.id;
    this.classForm.setValue({
      name: gymClass.name,
      categoryId: gymClass.categoryId,
      trainerId: gymClass.trainerId,
      initCapacity: gymClass.initCapacity,
    });
    this.classForm.markAsPristine();
    this.classForm.markAsUntouched();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteClass(gymClass: GymClassResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Delete class',
        message: `Delete ${gymClass.name}? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.classesService.delete(gymClass.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter((item) => item.id !== gymClass.id);
          showAppSnack(this.snackBar, 'Class deleted successfully.');
          if (this.editingClassId === gymClass.id) {
            this.resetForm();
          }
        },
        error: (error: HttpErrorResponse) => {
          showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not delete this class.'), 'error');
        },
      });
    });
  }

  private createClass(request: GymClassRequest): void {
    this.isSaving = true;

    this.classesService.create(request).pipe(
      finalize(() => {
        this.isSaving = false;
      }),
    ).subscribe({
      next: (gymClass) => {
        this.dataSource.data = [...this.dataSource.data, gymClass];
        showAppSnack(this.snackBar, 'Class added successfully.');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not add this class.'), 'error');
      },
    });
  }

  private updateClass(id: number, request: GymClassRequest): void {
    this.isSaving = true;

    this.classesService.update(id, request).pipe(
      finalize(() => {
        this.isSaving = false;
      }),
    ).subscribe({
      next: (updatedClass) => {
        this.dataSource.data = this.dataSource.data.map((item) =>
          item.id === updatedClass.id ? updatedClass : item,
        );
        showAppSnack(this.snackBar, 'Class updated successfully.');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not update this class.'), 'error');
      },
    });
  }

  private resetForm(): void {
    this.editingClassId = null;
    const blank = {
      name: '',
      categoryId: this.categories[0]?.id ?? 0,
      trainerId: this.trainers[0]?.id ?? 0,
      initCapacity: 10,
    };
    AppValidators.resetForm(this.classForm, blank, this.formDirective);
  }

  private connectTable(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
}
