import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CoachService } from '../../core/services/coach.service';
import { CourseService } from '../../core/services/course.service';
import { CourseScheduleService } from '../../core/services/course-schedule.service';
import { CoachResponse } from '../../models/coach.model';
import { CourseResponse, CourseScheduleResponse } from '../../models/course.model';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit {
  loading = true;

  activePage: 'dashboard' | 'seances' | 'profil' | 'securite' = 'dashboard';
  pageTitle = 'Dashboard Coach';
  pageBreadcrumb = 'Vue d\'ensemble';
  todayDate = '';

  coachName = 'Coach';
  coachInitial = 'C';

  private pages: Record<string, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Dashboard Coach', breadcrumb: 'Vue d\'ensemble' },
    seances: { title: 'Mes séances', breadcrumb: 'Gestion des séances' },
    profil: { title: 'Mon profil', breadcrumb: 'Informations personnelles' },
    securite: { title: 'Sécurité', breadcrumb: 'Mot de passe & accès' }
  };

  coach: CoachResponse | null = null;
  courses: CourseResponse[] = [];
  mySchedules: CourseScheduleResponse[] = [];

  profileForm = {
    displayName: '',
    phone: '',
    bio: '',
    certifications: ''
  };
  profileLoading = false;
  profileSuccess = '';
  profileError = '';

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordLoading = false;
  passwordSuccess = '';
  passwordError = '';

  confirmingId: number | null = null;
  confirmedScheduleIds = new Set<number>();
  sessionMsg = '';

  constructor(
    private auth: AuthService,
    private coachService: CoachService,
    private courseService: CourseService,
    private scheduleService: CourseScheduleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.hasRole('ROLE_COACH')) {
      this.router.navigate(['/forbidden']);
      return;
    }

    const now = new Date();
    this.todayDate = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    this.loadCoachDashboard();
  }

  goTo(page: 'dashboard' | 'seances' | 'profil' | 'securite'): void {
    this.activePage = page;
    const p = this.pages[page];
    if (p) {
      this.pageTitle = p.title;
      this.pageBreadcrumb = p.breadcrumb;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private loadCoachDashboard(): void {
    this.loading = true;
    this.loadCoachFallbackProfile();
  }

  private loadCoachFallbackProfile(): void {
    const userId = Number(localStorage.getItem('userId'));
    const payload = this.auth.getPayload();

    // Try admin list endpoint if accessible for coach user.
    this.coachService.listAll().subscribe({
      next: coaches => {
        const byUserId = Number.isFinite(userId) ? coaches.find(c => c.userId === userId) : null;
        const byDisplayName = payload?.sub
          ? coaches.find(c => (c.displayName || '').toLowerCase() === String(payload.sub).toLowerCase())
          : null;

        this.coach = byUserId || byDisplayName || null;

        if (!this.coach) {
          this.loadCoachFromActiveFallback(userId, payload?.sub);
          return;
        }

        this.profileForm = {
          displayName: this.coach.displayName || '',
          phone: this.coach.phone || '',
          bio: this.coach.bio || '',
          certifications: this.coach.certifications || ''
        };
        this.coachName = this.coach.displayName || 'Coach';
        this.coachInitial = this.coachName.charAt(0).toUpperCase();
        this.loadCoursesAndSchedules();
      },
      error: () => {
        this.loadCoachFromActiveFallback(userId, payload?.sub);
      }
    });
  }

  private loadCoachFromActiveFallback(userId: number, username?: string): void {
    this.coachService.listActive().subscribe({
      next: coaches => {
        const byUserId = Number.isFinite(userId) ? coaches.find(c => c.userId === userId) : null;
        const byDisplayName = username
          ? coaches.find(c => (c.displayName || '').toLowerCase() === String(username).toLowerCase())
          : null;

        this.coach = byUserId || byDisplayName || null;

        if (!this.coach) {
          this.loading = false;
          this.profileError = 'Profil coach introuvable. Contactez un administrateur.';
          return;
        }

        this.profileForm = {
          displayName: this.coach.displayName || '',
          phone: this.coach.phone || '',
          bio: this.coach.bio || '',
          certifications: this.coach.certifications || ''
        };
        this.coachName = this.coach.displayName || 'Coach';
        this.coachInitial = this.coachName.charAt(0).toUpperCase();
        this.loadCoursesAndSchedules();
      },
      error: () => {
        this.loading = false;
        this.profileError = 'Impossible de charger le profil coach (/coaches/me non disponible).';
      }
    });
  }

  private loadCoursesAndSchedules(): void {
    this.courseService.list().subscribe({
      next: courses => {
        this.courses = courses;
        this.scheduleService.listAll().subscribe({
          next: schedules => {
            const coachId = this.coach?.id;
            this.mySchedules = (coachId
              ? schedules.filter(s => s.coachId === coachId)
              : []
            ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            this.loading = false;
          },
          error: () => {
            this.mySchedules = [];
            this.loading = false;
            this.sessionMsg = 'Séances indisponibles pour le moment.';
          }
        });
      },
      error: () => {
        this.courses = [];
        this.loading = false;
      }
    });
  }

  get upcomingSchedules(): CourseScheduleResponse[] {
    const now = Date.now();
    return this.mySchedules.filter(s => new Date(s.startTime).getTime() >= now);
  }

  get pastSchedules(): CourseScheduleResponse[] {
    const now = Date.now();
    return this.mySchedules.filter(s => new Date(s.startTime).getTime() < now);
  }

  get confirmedTodayCount(): number {
    return this.mySchedules.filter(s => (s.active ?? false) && this.isToday(s.startTime)).length;
  }

  getCourseName(courseId: number): string {
    return this.courses.find(c => c.id === courseId)?.name || 'Cours #' + courseId;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  isConfirmed(scheduleId: number): boolean {
    const schedule = this.mySchedules.find(s => s.id === scheduleId);
    return (schedule?.active ?? false) || this.confirmedScheduleIds.has(scheduleId);
  }

  confirmSchedule(schedule: CourseScheduleResponse): void {
    if (this.confirmingId || !this.coach) return;
    this.confirmingId = schedule.id;
    this.sessionMsg = '';

    const finalizeSuccess = (updated?: CourseScheduleResponse): void => {
      const idx = this.mySchedules.findIndex(s => s.id === schedule.id);
      if (idx >= 0) {
        this.mySchedules[idx] = updated ?? { ...this.mySchedules[idx], active: true };
      }
      this.confirmedScheduleIds.add(schedule.id);
      this.sessionMsg = 'Séance confirmée avec succès.';
      this.confirmingId = null;
    };

    const finalizeError = (err: any): void => {
      this.confirmingId = null;
      if (err?.status === 403) {
        this.sessionMsg = 'Action refusée (403): votre compte coach n\'a pas la permission backend pour confirmer une séance.';
        return;
      }
      this.sessionMsg = err?.error?.message || 'Impossible de confirmer cette séance.';
    };

    this.coachService.confirmMySchedule(schedule.id).subscribe({
      next: updated => finalizeSuccess(updated),
      error: confirmErr => finalizeError(confirmErr)
    });
  }

  saveProfile(): void {
    if (!this.coach) return;
    this.profileError = '';
    this.profileSuccess = '';

    if (!this.profileForm.displayName.trim()) {
      this.profileError = 'Le nom est obligatoire.';
      return;
    }

    this.profileLoading = true;
    this.coachService.update(this.coach.id, {
      displayName: this.profileForm.displayName.trim(),
      phone: this.profileForm.phone.trim() || null,
      bio: this.profileForm.bio.trim() || null,
      certifications: this.profileForm.certifications.trim() || null,
      active: this.coach.active ?? true,
      photoUrl: this.coach.photoUrl || null,
      userId: this.coach.userId
    }).subscribe({
      next: updated => {
        this.coach = updated;
        this.coachName = updated.displayName || 'Coach';
        this.coachInitial = this.coachName.charAt(0).toUpperCase();
        this.profileLoading = false;
        this.profileSuccess = 'Profil mis à jour.';
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err?.error?.message || 'Erreur lors de la mise à jour du profil.';
      }
    });
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.passwordError = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'La confirmation du mot de passe ne correspond pas.';
      return;
    }

    this.passwordLoading = true;
    this.auth.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe mis à jour avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }

  private isToday(iso: string): boolean {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  }
}
