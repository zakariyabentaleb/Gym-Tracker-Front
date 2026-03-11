import { Component } from '@angular/core';

@Component({
  selector: 'app-members-list',
  standalone: true,
  template: `
    <div class="page-shell">
      <h1 class="page-title">👥 Members</h1>
      <p class="page-subtitle">Browse and manage the gym member directory.</p>

      <div class="card" style="padding:32px; text-align:center;">
        <p style="font-size:1.1rem; opacity:.7;">Member list will appear here.</p>
        <p style="margin-top:8px;"><span class="pill pill-warn">ROLE_ADMIN / ROLE_RECEPTIONIST required</span></p>
      </div>
    </div>
  `
})
export class MembersListComponent {}
