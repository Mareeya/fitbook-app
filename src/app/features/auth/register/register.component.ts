import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppValidators } from '../../../shared/validators/app.validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;

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
      alert('Please enter name, email, and password.');
      return;
    }

    this.isLoading = true;

    this.authService.register({ name, email, password }).subscribe({
      next: (user) => {
        this.authService.saveUser(user);
        this.isLoading = false;
        this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 409) {
          alert(typeof error.error === 'string' ? error.error : 'This email is already registered.');
          return;
        }

        if (error.status === 400) {
          alert(typeof error.error === 'string' ? error.error : 'Please enter a valid name, email, and password.');
          return;
        }

        alert('Cannot connect to the backend. Run the API first.');
      },
    });
  }
}
