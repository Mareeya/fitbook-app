import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.parseUrl(authService.getHomeRoute());
  }

  return true;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canManage()) {
    return true;
  }

  return router.parseUrl(authService.getHomeRoute());
};

export const trainerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isTrainer()) {
    return true;
  }

  return router.parseUrl(authService.getHomeRoute());
};

export const memberGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isMember()) {
    return true;
  }

  return router.parseUrl(authService.getHomeRoute());
};

export const manageOrTrainerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canManage() || authService.isTrainer()) {
    return true;
  }

  return router.parseUrl(authService.getHomeRoute());
};
