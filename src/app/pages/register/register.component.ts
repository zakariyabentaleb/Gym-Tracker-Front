import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { MemberService } from '../../core/services/member.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  username = '';
  phone = '';
  password = '';
  plan = 'starter';
  acceptTerms = false;

  error = '';
  success = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private memberService: MemberService,
    private router: Router
  ) {}

  submit() {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.auth.register(this.username, this.password, 'ROLE_MEMBER').pipe(
      switchMap((registerRes) => {
        const userId = registerRes?.userId;
        if (!userId) throw new Error('No userId returned from registration');
        return this.memberService.create({
          userId,
          firstName: this.firstName,
          lastName: this.lastName,
          phone: this.phone || null,
          active: true
        });
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Compte créé avec succès ! Redirection...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Erreur lors de la création du compte';
      }
    });
  }
}
