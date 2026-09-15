import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-member-home',
  templateUrl: './member-home.component.html',
  styleUrl: './member-home.component.scss',
})
export class MemberHomeComponent {
  private readonly authService = inject(AuthService);

  user = this.authService.getUser();
}
