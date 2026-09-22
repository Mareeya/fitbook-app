import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { showAppSnack } from '../../helpers/app-snackbar';

@Component({
  selector: 'app-app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatProgressBarModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  /** Parent nav links (e.g. /trainer, /home) must not stay active on child routes. */
  readonly exactActiveLink = { exact: true } as const;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly drawer = viewChild<MatSidenav>('drawer');
  readonly currentUser = this.authService.currentUser;
  readonly isNavigating = signal(false);
  /** Phones only — tablet and desktop keep a fixed sidebar. */
  readonly isOverlayNav = toSignal(
    this.breakpointObserver.observe(['(max-width: 767px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  constructor() {
    this.authService.refreshProfile().subscribe();

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isOverlayNav()) {
          this.drawer()?.close();
        }
      });
  }

  canManage(): boolean {
    return this.authService.canManage();
  }

  isTrainer(): boolean {
    return this.authService.isTrainer();
  }

  isMember(): boolean {
    return this.authService.isMember();
  }

  homeLink(): string {
    return this.authService.getHomeRoute();
  }

  logout(): void {
    this.authService.logout();
    showAppSnack(this.snackBar, 'You have been logged out.');
    void this.router.navigate(['/login']);
  }
}
