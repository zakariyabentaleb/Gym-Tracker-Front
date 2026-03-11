import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-shell" style="text-align:center; padding-top:80px;">
      <div style="font-size:4rem; margin-bottom:16px;">🚫</div>
      <h1 class="page-title">Access Denied</h1>
      <p class="page-subtitle">You don't have the required role to view this page.</p>
      <a class="btn btn-primary" routerLink="/" style="margin-top:24px;">Back to home</a>
    </div>
  `
})
export class ForbiddenComponent {}
