import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;

  loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  login(): void {
    const email = this.loginForm.controls.email.value.trim();
    const password = this.loginForm.controls.password.value.trim();
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
        this.router.navigate(['/admin/trainers']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) {
          alert('Invalid email or password.');
        } else {
          alert('Cannot connect to the backend. Run the API first.');
        }
      },
    });
  }
}
