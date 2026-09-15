import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;

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
      alert('Please enter email and password.');
      return;
    }

    this.isLoading = true;

    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        this.authService.saveUser(user);
        this.isLoading = false;
        this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) {
          alert('Invalid email or password.');
          return;
        }

        alert(apiErrorMessage(error, 'Something went wrong. Please try again.'));
      },
    });
  }
}
