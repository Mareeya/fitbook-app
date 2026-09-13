import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrainerRequest } from '../../../models/trainer-request.model';
import { TrainerResponse } from '../../../models/trainer-response.model';
import { TrainersService } from './trainers.service';

@Component({
  selector: 'app-trainers-page',
  imports: [ReactiveFormsModule],
  templateUrl: './trainers-page.component.html',
  styleUrl: './trainers-page.component.scss',
})
export class TrainersPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly trainersService = inject(TrainersService);

  trainers: TrainerResponse[] = [];
  editingTrainerId: number | null = null;
  deletingTrainerId: number | null = null;
  isLoading = false;
  isSaving = false;

  trainerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    specialty: ['', [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)]],
  });

  ngOnInit(): void {
    this.loadTrainers();
  }

  loadTrainers(): void {
    this.isLoading = true;

    this.trainersService.getAll().subscribe({
      next: (trainers) => {
        this.trainers = trainers;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        alert(this.getErrorMessage(error));
        this.isLoading = false;
      },
    });
  }

  saveTrainer(): void {
    if (this.trainerForm.invalid) {
      this.trainerForm.markAllAsTouched();
      alert('Please enter trainer name and specialty.');
      return;
    }

    const request: TrainerRequest = {
      name: this.trainerForm.controls.name.value.trim(),
      specialty: this.trainerForm.controls.specialty.value.trim(),
    };

    if (this.editingTrainerId !== null) {
      const ok = confirm('Save changes to this trainer?');
      if (!ok) {
        return;
      }
      this.updateTrainer(this.editingTrainerId, request);
      return;
    }

    this.createTrainer(request);
  }

  editTrainer(trainer: TrainerResponse): void {
    this.editingTrainerId = trainer.id;
    this.trainerForm.setValue({
      name: trainer.name,
      specialty: trainer.specialty,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteTrainer(trainer: TrainerResponse): void {
    const ok = confirm('Delete ' + trainer.name + '?');
    if (!ok) {
      return;
    }

    this.deletingTrainerId = trainer.id;

    this.trainersService.delete(trainer.id).subscribe({
      next: () => {
        this.trainers = this.trainers.filter((item) => item.id !== trainer.id);
        alert('Trainer deleted successfully.');
        this.deletingTrainerId = null;

        if (this.editingTrainerId === trainer.id) {
          this.resetForm();
        }
      },
      error: (error: HttpErrorResponse) => {
        alert(this.getErrorMessage(error));
        this.deletingTrainerId = null;
      },
    });
  }

  private createTrainer(request: TrainerRequest): void {
    this.isSaving = true;

    this.trainersService.create(request).subscribe({
      next: (trainer) => {
        this.trainers = [...this.trainers, trainer];
        alert('Trainer added successfully.');
        this.isSaving = false;
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        alert(this.getErrorMessage(error));
        this.isSaving = false;
      },
    });
  }

  private updateTrainer(id: number, request: TrainerRequest): void {
    this.isSaving = true;

    this.trainersService.update(id, request).subscribe({
      next: (updatedTrainer) => {
        this.trainers = this.trainers.map((trainer) =>
          trainer.id === id ? updatedTrainer : trainer,
        );
        alert('Trainer updated successfully.');
        this.isSaving = false;
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        alert(this.getErrorMessage(error));
        this.isSaving = false;
      },
    });
  }

  private resetForm(): void {
    this.editingTrainerId = null;
    this.trainerForm.reset();
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot connect to the API. Please make sure the backend is running.';
    }

    if (error.status === 409) {
      return 'This trainer is assigned to a class and cannot be deleted.';
    }

    if (error.status === 404) {
      return 'Trainer was not found. Refresh the list and try again.';
    }

    if (error.status === 400) {
      return 'Please check the entered information.';
    }

    return 'Something went wrong. Please try again.';
  }
}
