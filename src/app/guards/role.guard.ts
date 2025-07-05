import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les rôles requis depuis la route
  const requiredRoles = route.data?.['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Aucun rôle requis, accès autorisé
  }

  // Vérifier si l'utilisateur a un des rôles requis
  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // Rediriger vers le dashboard si l'utilisateur n'a pas les permissions
  router.navigate(['/dashboard']);
  return false;
}; 