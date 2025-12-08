import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'];

  if (authService.isLoggedIn && authService.userRole === expectedRole) {
    return true;
  }

  // Redirect to dashboard or login if not authorized
  router.navigate(['/dashboard']);
  return false;
};
