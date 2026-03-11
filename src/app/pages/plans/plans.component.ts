import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionPlanService } from '../../core/services/subscription-plan.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PaypalService } from '../../core/services/paypal.service';
import { PlanResponse } from '../../models/subscription-plan.model';
import { SubscriptionResponse } from '../../models/subscription.model';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

declare var paypal: any;

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css']
})
export class PlansComponent implements OnInit, OnDestroy {
  plans: PlanResponse[] = [];
  loading = true;

  // member subscription state
  mySubscriptions: SubscriptionResponse[] = [];
  activeSub: SubscriptionResponse | null = null;
  subscribing = false;
  subscribeError = '';
  subscribeSuccess = '';

  // PayPal modal state
  showPaypalModal = false;
  selectedPlan: PlanResponse | null = null;
  paypalLoaded = false;
  private paypalScriptEl: HTMLScriptElement | null = null;

  constructor(
    private planService: SubscriptionPlanService,
    private subService: SubscriptionService,
    private paypalService: PaypalService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: data => {
        this.plans = data.filter(p => p.active);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    if (this.auth.hasRole('ROLE_MEMBER')) {
      this.loadMySubscriptions();
    }

    this.loadPayPalScript();
  }

  ngOnDestroy(): void {
    if (this.paypalScriptEl) {
      this.paypalScriptEl.remove();
    }
  }

  private loadPayPalScript(): void {
    if (typeof paypal !== 'undefined') {
      this.paypalLoaded = true;
      return;
    }
    // Check if script tag already exists (e.g. from previous navigation)
    const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existing) {
      existing.remove();
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=USD`;
    script.onload = () => {
      this.paypalLoaded = true;
      // If modal is already open, render buttons now
      if (this.showPaypalModal && this.selectedPlan) {
        setTimeout(() => this.renderPaypalButtons(), 50);
      }
    };
    script.onerror = () => { console.error('Failed to load PayPal SDK'); };
    document.head.appendChild(script);
    this.paypalScriptEl = script;
  }

  loadMySubscriptions(): void {
    this.subService.mySubscriptions().subscribe({
      next: subs => {
        this.mySubscriptions = subs;
        this.activeSub = subs.find(s => s.status === 'ACTIVE') || null;
      }
    });
  }

  openPaypalModal(plan: PlanResponse): void {
    this.selectedPlan = plan;
    this.showPaypalModal = true;
    this.subscribeError = '';
    this.subscribeSuccess = '';

    // Poll until both the DOM container and PayPal SDK are ready
    this.waitAndRenderPaypal();
  }

  private waitAndRenderPaypal(): void {
    const tryRender = () => {
      const container = document.getElementById('paypal-button-container');
      if (container && typeof paypal !== 'undefined') {
        this.paypalLoaded = true;
        this.renderPaypalButtons();
      } else if (this.showPaypalModal) {
        setTimeout(tryRender, 200);
      }
    };
    setTimeout(tryRender, 150);
  }

  closePaypalModal(): void {
    this.showPaypalModal = false;
    this.selectedPlan = null;
    // Clear the PayPal button container
    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';
  }

  private renderPaypalButtons(): void {
    const container = document.getElementById('paypal-button-container');
    if (!container || typeof paypal === 'undefined' || !this.selectedPlan) return;

    // Prevent double-render
    if (container.childElementCount > 0) return;

    const planId = this.selectedPlan.id;

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay'
      },
      createOrder: () => {
        return new Promise<string>((resolve, reject) => {
          this.paypalService.createOrder(planId).subscribe({
            next: res => resolve(res.orderId),
            error: err => {
              this.subscribeError = 'Erreur lors de la création de la commande PayPal.';
              reject(err);
            }
          });
        });
      },
      onApprove: (data: any) => {
        this.subscribing = true;
        this.paypalService.captureOrder(data.orderID, planId).subscribe({
          next: () => {
            this.subscribeSuccess = 'Paiement effectué et abonnement activé avec succès !';
            this.subscribing = false;
            this.closePaypalModal();
            this.loadMySubscriptions();
          },
          error: (err: any) => {
            this.subscribeError = err?.error?.message || 'Erreur lors de la capture du paiement.';
            this.subscribing = false;
            this.closePaypalModal();
          }
        });
      },
      onError: (err: any) => {
        console.error('PayPal error', err);
        this.subscribeError = 'Erreur PayPal. Veuillez réessayer.';
        this.closePaypalModal();
      },
      onCancel: () => {
        this.closePaypalModal();
      }
    }).render('#paypal-button-container');
  }

  subscribeToPlan(planId: number): void {
    if (this.subscribing) return;
    this.subscribing = true;
    this.subscribeError = '';
    this.subscribeSuccess = '';

    this.subService.subscribeMe({ planId, autoRenew: false }).subscribe({
      next: () => {
        this.subscribeSuccess = 'Abonnement activé avec succès !';
        this.subscribing = false;
        this.loadMySubscriptions();
      },
      error: (err) => {
        this.subscribeError = err?.error?.message || err?.error || 'Erreur lors de l\'abonnement.';
        this.subscribing = false;
      }
    });
  }

  isActivePlan(planId: number): boolean {
    return this.activeSub?.planId === planId;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  formatPriceInt(cents: number): string {
    return Math.floor(cents / 100).toString();
  }

  formatPriceDec(cents: number): string {
    const dec = cents % 100;
    return dec < 10 ? '0' + dec : dec.toString();
  }

  getDurationLabel(days: number): string {
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

  scrollToPlans(): void {
    document.querySelector('.plans-container')?.scrollIntoView({ behavior: 'smooth' });
  }
}
