import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { AppValidators } from '../../../shared/validators/app.validators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isLoading = false;
  hidePassword = true;

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120), AppValidators.personName]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(256)]),
    password: new FormControl('', [Validators.required, AppValidators.password]),
  });

  register(): void {
    const formValue = this.registerForm.value;
    const name = (formValue.name || '').trim();
    const email = (formValue.email || '').trim();
    const password = (formValue.password || '').trim();
    this.registerForm.patchValue({ name, email, password });

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.register({ name, email, password }).pipe(
      switchMap((user) => this.authService.completeSignIn(user)),
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: () => {
        showAppSnack(this.snackBar, 'Account created successfully.');
        void this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          showAppSnack(
            this.snackBar,
            typeof error.error === 'string' ? error.error : 'This email is already registered.',
            'error',
          );
          return;
        }

        if (error.status === 400) {
          showAppSnack(
            this.snackBar,
            typeof error.error === 'string' ? error.error : 'Please enter a valid name, email, and password.',
            'error',
          );
          return;
        }

        showAppSnack(this.snackBar, apiErrorMessage(error, 'Cannot connect to the backend. Run the API first.'), 'error');
      },
    });
  }
}
