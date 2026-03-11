import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-member-me',
  standalone: true,
  template: `
    <div class="page-shell">
      <h1 class="page-title">👤 My Profile</h1>
      <p class="page-subtitle">Your personal membership dashboard.</p>

      <div class="card" style="max-width:480px;">
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <div style="font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--c-text-dim); margin-bottom:4px;">Roles</div>
            <span class="pill pill-ok">{{ roles || '—' }}</span>
          </div>
          <div>
            <div style="font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--c-text-dim); margin-bottom:4px;">Status</div>
            <span class="pill pill-ok">● Active</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MemberMeComponent {
  constructor(private auth: AuthService) {}

  get roles(): string {
    return this.auth.getUserRoles().join(', ');
  }
}
