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
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isLoading = false;
  hidePassword = true;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  login(): void {
    const formValue = this.loginForm.value;
    const email = (formValue.email || '').trim();
    const password = (formValue.password || '').trim();
    this.loginForm.patchValue({ email, password });

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login({ email, password }).pipe(
      switchMap((user) => this.authService.completeSignIn(user)),
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: () => {
        showAppSnack(this.snackBar, 'Logged in successfully.');
        void this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          showAppSnack(this.snackBar, 'Invalid email or password.', 'error');
          return;
        }

        showAppSnack(this.snackBar, apiErrorMessage(error, 'Something went wrong. Please try again.'), 'error');
      },
    });
  }
}
