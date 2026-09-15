import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrainerRequest } from './models/trainer-request.model';
import { TrainerResponse } from './models/trainer-response.model';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { AppValidators } from '../../../shared/validators/app.validators';
import { TrainersService } from './services/trainers.service';

@Component({
  selector: 'app-trainers-page',
  imports: [ReactiveFormsModule],
  templateUrl: './trainers-page.component.html',
  styleUrl: './trainers-page.component.scss',
})
export class TrainersPageComponent implements OnInit {
  private readonly trainersService = inject(TrainersService);

  trainers: TrainerResponse[] = [];
  editingTrainerId: number | null = null;
  isLoading = false;
  isSaving = false;

  trainerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120), AppValidators.personName]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(256)]),
    password: new FormControl('', [Validators.maxLength(100), AppValidators.optionalPassword]),
    specialty: new FormControl('', [Validators.required, Validators.maxLength(80), AppValidators.label]),
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
    const formValue = this.trainerForm.value;
    const password = (formValue.password || '').trim();

    if (this.editingTrainerId === null && !password) {
      this.trainerForm.controls.password.markAsTouched();
      alert('Please enter name, email, password, and specialty.');
      return;
    }

    if (this.trainerForm.invalid) {
      this.trainerForm.markAllAsTouched();
      alert('Please enter a valid name, email, and specialty.');
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
    this.trainerForm.setValue({
      name: trainer.name,
      email: trainer.email,
      password: '',
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

    this.trainersService.delete(trainer.id).subscribe({
      next: () => {
        this.trainers = this.trainers.filter((item) => item.id !== trainer.id);
        alert('Trainer deleted successfully.');
        if (this.editingTrainerId === trainer.id) {
          this.resetForm();
        }
      },
      error: (error: HttpErrorResponse) => {
        alert(this.getErrorMessage(error));
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
    this.trainerForm.reset({
      name: '',
      email: '',
      password: '',
      specialty: '',
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409 && typeof error.error !== 'string') {
      return 'This trainer is assigned to a class and cannot be deleted.';
    }

    return apiErrorMessage(error, 'Something went wrong. Please try again.');
  }
}
