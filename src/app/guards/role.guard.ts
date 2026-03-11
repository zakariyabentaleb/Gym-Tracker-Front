import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const roles = (route.data?.['roles'] as string[]) ?? [];

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    if (roles.length === 0) return true;

    for (const r of roles) {
      if (this.auth.hasRole(r)) return true;
    }

    this.router.navigate(['/forbidden']);
    return false;
  }
}
