import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { SubscriptionPlanService } from '../../core/services/subscription-plan.service';
import { SubscriptionResponse } from '../../models/subscription.model';
import { PlanResponse } from '../../models/subscription-plan.model';

@Component({
  selector: 'app-mon-abonnement',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mon-abonnement.component.html',
  styleUrls: ['./mon-abonnement.component.css']
})
export class MonAbonnementComponent implements OnInit {
  subscriptions: SubscriptionResponse[] = [];
  plans: PlanResponse[] = [];
  loading = true;

  constructor(
    private subService: SubscriptionService,
    private planService: SubscriptionPlanService
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: plans => {
        this.plans = plans;
        this.subService.mySubscriptions().subscribe({
          next: subs => {
            this.subscriptions = subs.sort((a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            );
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  get activeSub(): SubscriptionResponse | null {
    return this.subscriptions.find(s => s.status === 'ACTIVE') || null;
  }

  get pastSubs(): SubscriptionResponse[] {
    return this.subscriptions.filter(s => s.status !== 'ACTIVE');
  }

  getPlanName(planId: number): string {
    return this.plans.find(p => p.id === planId)?.name || 'Plan #' + planId;
  }

  getPlanPrice(planId: number): string {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return '—';
    return (plan.priceCents / 100).toFixed(2) + ' MAD';
  }

  getDurationLabel(planId: number): string {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return '—';
    const days = plan.durationDays;
    if (days === 1) return '1 jour';
    if (days <= 7) return days + ' jours';
    if (days <= 31) return Math.round(days / 7) + ' semaines';
    if (days <= 365) return Math.round(days / 30) + ' mois';
    return Math.round(days / 365) + ' an(s)';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  daysRemaining(): number {
    if (!this.activeSub) return 0;
    const end = new Date(this.activeSub.endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  progressPercent(): number {
    if (!this.activeSub) return 0;
    const start = new Date(this.activeSub.startDate).getTime();
    const end = new Date(this.activeSub.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    if (total <= 0) return 100;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Actif',
      EXPIRED: 'Expiré',
      CANCELLED: 'Annulé',
      SUSPENDED: 'Suspendu'
    };
    return map[status] || status;
  }
}
