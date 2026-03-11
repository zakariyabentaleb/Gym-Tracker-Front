import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { MemberCreateRequest, MemberResponse, MemberUpdateRequest } from '../../../models/member.model';
import { MemberFormComponent } from '../member-form/member-form.component';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';
import { SubscriptionResponse } from '../../../models/subscription.model';
import { PlanResponse } from '../../../models/subscription-plan.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MemberFormComponent],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  member?: MemberResponse;
  saved = false;
  error = '';
  editing = false;

  activeSub: SubscriptionResponse | null = null;
  activePlan: PlanResponse | null = null;
  plans: PlanResponse[] = [];

  // Password change
  showPasswordModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = false;
  passwordLoading = false;

  constructor(
    private svc: MemberService,
    private subService: SubscriptionService,
    private planService: SubscriptionPlanService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadSubscription();
  }

  private loadProfile() {
    this.svc.me().subscribe({
      next: m => this.member = m,
      error: () => this.error = 'Impossible de charger votre profil.'
    });
  }

  private loadSubscription() {
    this.planService.list().subscribe({
      next: plans => {
        this.plans = plans;
        this.subService.mySubscriptions().subscribe({
          next: subs => {
            this.activeSub = subs.find(s => s.status === 'ACTIVE') || null;
            if (this.activeSub) {
              this.activePlan = plans.find(p => p.id === this.activeSub!.planId) || null;
            }
          }
        });
      }
    });
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    this.saved = false;
    this.error = '';
  }

  onUpdate(req: MemberCreateRequest) {
    if (!this.member) return;
    const update: MemberUpdateRequest = {
      firstName: req.firstName,
      lastName: req.lastName,
      phone: req.phone,
      birthDate: req.birthDate,
      active: req.active
    };
    this.svc.updateMe(update).subscribe({
      next: m => {
        this.member = m;
        this.saved = true;
        this.editing = false;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => this.error = 'Erreur lors de la mise à jour du profil.'
    });
  }

  getInitials(): string {
    if (!this.member) return '?';
    return ((this.member.firstName?.charAt(0) || '') + (this.member.lastName?.charAt(0) || '')).toUpperCase();
  }

  getFullName(): string {
    if (!this.member) return '';
    return `${this.member.firstName} ${this.member.lastName}`;
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getSubProgress(): number {
    if (!this.activeSub) return 0;
    const start = new Date(this.activeSub.startDate).getTime();
    const end = new Date(this.activeSub.endDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  }

  getDaysLeft(): number {
    if (!this.activeSub) return 0;
    const end = new Date(this.activeSub.endDate).getTime();
    const diff = end - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = false;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  submitPassword(): void {
    this.passwordError = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Veuillez remplir tous les champs.';
      return;
    }
    if (this.newPassword.length < 4) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 4 caract\u00e8res.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.passwordLoading = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = true;
        setTimeout(() => this.closePasswordModal(), 2000);
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
