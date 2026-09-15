import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { GymClassResponse } from '../../admin/classes-page/models/gym-class-response.model';
import { ClassesService } from '../../admin/classes-page/services/classes.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-my-classes',
  templateUrl: './my-classes.component.html',
  styleUrl: './my-classes.component.scss',
})
export class MyClassesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classesService = inject(ClassesService);

  user = this.authService.getUser();
  classes: GymClassResponse[] = [];
  isLoading = false;
  todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 17) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    const userId = this.user?.id;
    if (!userId) {
      return;
    }

    this.isLoading = true;
    this.classesService.getByTrainerUser(userId).subscribe({
      next: (classes) => {
        this.classes = classes;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        alert(error.status === 0 ? 'Cannot connect to the backend. Run the API first.' : 'Could not load classes.');
      },
    });
  }
}
