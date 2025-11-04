import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loading$ = toObservable(authService.loading);

  await firstValueFrom(loading$.pipe(filter(isLoading => isLoading === false)));

  if (!authService.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
}