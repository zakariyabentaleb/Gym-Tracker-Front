import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { MemberService } from '../../../core/services/member.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-create-member',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-shell">
      <h1 class="page-title">➕ New Member</h1>
      <p class="page-subtitle">Create a user account and fill in member details</p>

      @if (errorMsg) {
        <div class="alert alert-danger">⚠️ {{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="alert alert-ok">✅ {{ successMsg }}</div>
      }

      <div class="card form-card">
        <form (ngSubmit)="onCreate()" class="member-form">
          <h3 class="section-title">🔐 Account</h3>

          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input matInput [(ngModel)]="password" name="password" type="password" required>
            </mat-form-field>
          </div>

          <h3 class="section-title">👤 Personal Info</h3>

          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>First name</mat-label>
              <input matInput [(ngModel)]="firstName" name="firstName" required>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Last name</mat-label>
              <input matInput [(ngModel)]="lastName" name="lastName" required>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>Phone</mat-label>
              <input matInput [(ngModel)]="phone" name="phone">
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Birth date</mat-label>
              <input matInput [matDatepicker]="picker" [(ngModel)]="birthDate" name="birthDate">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-checkbox [(ngModel)]="active" name="active">Active</mat-checkbox>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="!username || !password || !firstName || !lastName || loading">
              {{ loading ? '⏳ Creating…' : '➕ Create Member' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 640px; margin-top: 8px; animation: fadeInUp 0.5s ease-out; }
    .member-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    .section-title { font-size: 0.95rem; font-weight: 700; color: var(--c-text); margin-top: 8px; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
    .alert { padding: 12px 16px; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; margin-bottom: 16px; backdrop-filter: blur(8px); animation: fadeInUp 0.3s ease-out; }
    .alert-danger { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: var(--c-danger); }
    .alert-ok { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: var(--c-ok); }
  `]
})
export class CreateMemberComponent {
  username = '';
  password = '';
  firstName = '';
  lastName = '';
  phone = '';
  birthDate: Date | null = null;
  active = true;
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private memberService: MemberService,
    private router: Router
  ) {}

  onCreate() {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;

    // Format birthDate as YYYY-MM-DD
    let birthDateStr: string | null = null;
    if (this.birthDate) {
      const d = this.birthDate;
      birthDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // Step 1: Register user with ROLE_MEMBER
    this.authService.register(this.username, this.password, 'ROLE_MEMBER').pipe(
      switchMap((registerRes) => {
        const userId = registerRes?.userId;
        if (!userId) throw new Error('No userId returned from registration');
        return this.memberService.create({
          userId,
          firstName: this.firstName,
          lastName: this.lastName,
          phone: this.phone || null,
          birthDate: birthDateStr,
          active: this.active
        });
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = `Member "${this.firstName} ${this.lastName}" created successfully!`;
        setTimeout(() => this.router.navigate(['/members']), 1500);
      },
      error: err => {
        this.loading = false;
        console.error('>>> Full error:', err);
        console.error('>>> Error body:', JSON.stringify(err.error));
        const body = err.error;
        let msg = '';
        if (typeof body === 'string') msg = body;
        else if (body) msg = body.message || body.error || JSON.stringify(body);
        else msg = err.message;
        this.errorMsg = msg || 'Failed to create member.';
      }
    });
  }
}
