import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GymClassRequest } from './models/gym-class-request.model';
import { GymClassResponse } from './models/gym-class-response.model';
import { LookupResponse } from './models/lookup-response.model';
import { TrainerResponse } from '../trainers-page/models/trainer-response.model';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { AppValidators } from '../../../shared/validators/app.validators';
import { TrainersService } from '../trainers-page/services/trainers.service';
import { LookupsService } from './services/lookups.service';
import { ClassesService } from './services/classes.service';

@Component({
  selector: 'app-classes-page',
  imports: [ReactiveFormsModule],
  templateUrl: './classes-page.component.html',
  styleUrl: './classes-page.component.scss',
})
export class ClassesPageComponent implements OnInit {
  private readonly classesService = inject(ClassesService);
  private readonly trainersService = inject(TrainersService);
  private readonly lookupsService = inject(LookupsService);

  classes: GymClassResponse[] = [];
  trainers: TrainerResponse[] = [];
  categories: LookupResponse[] = [];
  editingClassId: number | null = null;

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

  loadClasses(): void {
    this.classesService.getAll().subscribe({
      next: (classes) => {
        this.classes = classes;
      },
      error: () => {
        alert('Cannot load classes.');
      },
    });
  }

  loadCategories(): void {
    this.lookupsService.getByType('class').subscribe({
      next: (categories) => {
        this.categories = categories;
        this.classForm.patchValue({ categoryId: categories[0]?.id ?? 0 });
      },
      error: () => {
        alert('Cannot load categories.');
      },
    });
  }

  loadTrainers(): void {
    this.trainersService.getAll().subscribe({
      next: (trainers) => {
        this.trainers = trainers;
        this.classForm.patchValue({ trainerId: trainers[0]?.id ?? 0 });
      },
      error: () => {
        alert('Cannot load trainers.');
      },
    });
  }

  saveClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      alert('Please fill all fields.');
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
      this.classesService.update(this.editingClassId, request).subscribe({
        next: (updatedClass) => {
          this.classes = this.classes.map((item) =>
            item.id === updatedClass.id ? updatedClass : item,
          );
          alert('Class updated successfully.');
          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {
          alert(apiErrorMessage(error, 'Could not update this class.'));
        },
      });
      return;
    }

    this.classesService.create(request).subscribe({
      next: (gymClass) => {
        this.classes = [...this.classes, gymClass];
        alert('Class added successfully.');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        alert(apiErrorMessage(error, 'Could not add this class.'));
      },
    });
  }

  editClass(gymClass: GymClassResponse): void {
    this.editingClassId = gymClass.id;
    this.classForm.setValue({
      name: gymClass.name,
      categoryId: gymClass.categoryId,
      trainerId: gymClass.trainerId,
      initCapacity: gymClass.initCapacity,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteClass(gymClass: GymClassResponse): void {
    const ok = confirm('Delete ' + gymClass.name + '?');
    if (!ok) {
      return;
    }

    this.classesService.delete(gymClass.id).subscribe({
      next: () => {
        this.classes = this.classes.filter((item) => item.id !== gymClass.id);
        alert('Class deleted successfully.');
        if (this.editingClassId === gymClass.id) {
          this.resetForm();
        }
      },
      error: (error: HttpErrorResponse) => {
        alert(apiErrorMessage(error, 'Could not delete this class.'));
      },
    });
  }

  private resetForm(): void {
    this.editingClassId = null;
    this.classForm.reset({
      name: '',
      categoryId: this.categories[0]?.id ?? 0,
      trainerId: this.trainers[0]?.id ?? 0,
      initCapacity: 10,
    });
  }
}
