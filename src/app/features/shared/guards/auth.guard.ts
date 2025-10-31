import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  
  if (!auth.isLogged()) {
    console.log('[AuthGuard] Not logged in, redirecting to login');
    router.navigate(['/']);
    return false;
  }
  
  return true;
};