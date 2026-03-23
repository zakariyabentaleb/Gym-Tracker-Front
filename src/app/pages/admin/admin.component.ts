import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MemberService } from '../../core/services/member.service';
import { CoachService } from '../../core/services/coach.service';
import { CourseService } from '../../core/services/course.service';
import { CourseScheduleService } from '../../core/services/course-schedule.service';
import { MemberResponse } from '../../models/member.model';
import { CoachResponse } from '../../models/coach.model';
import { CourseResponse, CourseScheduleResponse } from '../../models/course.model';
import { PlanResponse } from '../../models/subscription-plan.model';
import { SubscriptionPlanService } from '../../core/services/subscription-plan.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PaymentService } from '../../core/services/payment.service';
import { SubscriptionResponse } from '../../models/subscription.model';
import { PaymentResponse } from '../../models/payment.model';
import { switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  private readonly apiHost = environment.apiUrl.startsWith('http')
    ? environment.apiUrl.replace(/\/api$/, '')
    : window.location.origin;

  /* ── sidebar ── */
  searchQuery = '';
  activePage = 'dashboard';

  /* ── topbar ── */
  pageTitle = 'Tableau de bord';
  pageBreadcrumb = 'Vue d\'ensemble';
  todayDate = '';

  /* ── admin user ── */
  adminName = 'Admin';
  adminInitial = 'A';

  /* ── dashboard KPIs ── */
  totalMembers = 0;
  activeMembers = 0;

  /* ── settings: profile & password ── */
  profileForm = {
    displayName: '',
    email: '',
    phone: ''
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

  /* ── members table ── */
  members: MemberResponse[] = [];
  memberSearch = '';
  currentPage = 0;
  pageSize = 10;

  /* ── modal ── */
  showMemberModal = false;
  modalError = '';
  modalSuccess = '';
  modalLoading = false;
  newMember = {
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    birthDate: ''
  };

  /* ── coaches ── */
  coaches: CoachResponse[] = [];
  allCoaches: CoachResponse[] = [];
  totalCoaches = 0;
  activeCoaches = 0;
  coachSearch = '';

  /* ── coach modal ── */
  showCoachModal = false;
  coachModalError = '';
  coachModalSuccess = '';
  coachModalLoading = false;
  editingCoachId: number | null = null;
  newCoach = {
    displayName: '',
    username: '',
    phone: '',
    bio: '',
    certifications: '',
    active: true
  };

  /* ── planning ── */
  planningTab: 'courses' | 'schedules' = 'courses';
  courses: CourseResponse[] = [];
  schedules: CourseScheduleResponse[] = [];
  totalCourses = 0;
  totalSchedules = 0;

  /* ── course modal ── */
  showCourseModal = false;
  courseModalError = '';
  courseModalSuccess = '';
  courseModalLoading = false;
  coursePhotoUploading = false;
  editingCourseId: number | null = null;
  newCourse = { name: '', description: '', durationMinutes: 60, capacity: 20, active: true, photoUrl: '' };

  /* ── schedule modal ── */
  showScheduleModal = false;
  scheduleModalError = '';
  scheduleModalSuccess = '';
  scheduleModalLoading = false;
  editingScheduleId: number | null = null;
  newSchedule = { courseId: 0, coachId: 0 as number | null, room: '', startTime: '', endTime: '', capacity: 20, active: false };

  /* ── subscription plans ── */
  plans: PlanResponse[] = [];
  totalPlans = 0;
  activePlans = 0;

  /* ── plan modal ── */
  showPlanModal = false;
  planModalError = '';
  planModalSuccess = '';
  planModalLoading = false;
  editingPlanId: number | null = null;
  newPlan = { name: '', durationDays: 30, priceCents: 0, includesClasses: false, description: '', active: true };

  /* ── finances: subscriptions & payments ── */
  financesTab: 'payments' | 'subscriptions' = 'payments';
  allPayments: PaymentResponse[] = [];
  allSubscriptions: SubscriptionResponse[] = [];
  totalPayments = 0;
  totalSubscriptions = 0;
  activeSubscriptions = 0;
  totalRevenue = 0;

  private pages: Record<string, { title: string; breadcrumb: string }> = {
    dashboard:     { title: 'Tableau de bord',  breadcrumb: 'Vue d\'ensemble' },
    membres:       { title: 'Membres',          breadcrumb: 'Gestion des membres' },
    planning:      { title: 'Planning',         breadcrumb: 'Planification des cours' },
    coachs:        { title: 'Coachs',           breadcrumb: 'Équipe de coachs' },
    abonnements:   { title: 'Abonnements',      breadcrumb: 'Gestion des plans' },
    finances:      { title: 'Finances',         breadcrumb: 'Revenus & dépenses' },
    parametres:    { title: 'Paramètres',       breadcrumb: 'Configuration' }
  };

  constructor(
    private auth: AuthService,
    private memberService: MemberService,
    private coachService: CoachService,
    private courseService: CourseService,
    private scheduleService: CourseScheduleService,
    private planService: SubscriptionPlanService,
    private subscriptionService: SubscriptionService,
    private paymentAdminService: PaymentService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.todayDate = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const payload = this.auth.getPayload();
    if (payload?.sub) {
      this.adminName = payload.sub;
      this.adminInitial = payload.sub.charAt(0).toUpperCase();
    }

    this.initializeSettingsForms();

    this.loadMembers();
    this.loadCoaches();
    this.loadCourses();
    this.loadSchedules();
    this.loadPlans();
    this.loadPayments();
    this.loadSubscriptions();
  }

  /* ── navigation ── */
  goTo(page: string): void {
    this.activePage = page;
    const p = this.pages[page];
    if (p) {
      this.pageTitle = p.title;
      this.pageBreadcrumb = p.breadcrumb;
    }
    if (page === 'membres') {
      this.loadMembers();
    }
    if (page === 'coachs') {
      this.loadCoaches();
    }
    if (page === 'planning') {
      this.loadCourses();
      this.loadSchedules();
    }
    if (page === 'abonnements') {
      this.loadPlans();
    }
    if (page === 'finances') {
      this.loadPayments();
      this.loadSubscriptions();
    }
  }

  /* ── members ── */
  loadMembers(): void {
    this.memberService.list(this.memberSearch || undefined, this.currentPage, this.pageSize).subscribe({
      next: data => {
        this.members = data.items;
        this.totalMembers = data.total;
        this.activeMembers = data.items.filter(m => m.active).length;
      }
    });
  }

  getInitials(m: MemberResponse): string {
    return ((m.firstName?.charAt(0) || '') + (m.lastName?.charAt(0) || '')).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  editMember(m: MemberResponse): void {
    this.router.navigate(['/members', m.id, 'edit']);
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadMembers();
    }
  }

  nextPage(): void {
    this.currentPage++;
    this.loadMembers();
  }

  /* ── modal ── */
  openMemberModal(): void {
    this.showMemberModal = true;
    this.modalError = '';
    this.modalSuccess = '';
    this.newMember = { firstName: '', lastName: '', username: '', phone: '', birthDate: '' };
  }

  closeMemberModal(): void {
    this.showMemberModal = false;
  }

  onModalOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-over')) {
      this.closeMemberModal();
    }
  }

  submitNewMember(): void {
    if (!this.newMember.firstName || !this.newMember.lastName || !this.newMember.username) {
      this.modalError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    this.modalSuccess = '';

    const password = this.newMember.username + '123';

    this.auth.register(this.newMember.username, password).pipe(
      switchMap((registerRes) => {
        const userId = registerRes?.userId;
        if (!userId) throw new Error('No userId returned from registration');
        return this.memberService.create({
          userId,
          firstName: this.newMember.firstName,
          lastName: this.newMember.lastName,
          phone: this.newMember.phone || null,
          birthDate: this.newMember.birthDate || null,
          active: true
        });
      })
    ).subscribe({
      next: () => {
        this.modalLoading = false;
        this.modalSuccess = 'Membre enregistré avec succès !';
        this.loadMembers();
        setTimeout(() => this.closeMemberModal(), 1500);
      },
      error: (err) => {
        this.modalLoading = false;
        this.modalError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  /* ── coaches ── */
  loadCoaches(): void {
    this.coachService.listAll().subscribe({
      next: (data) => {
        this.allCoaches = data;
        this.totalCoaches = data.length;
        this.activeCoaches = data.filter(c => c.active).length;
        this.filterCoaches();
      }
    });
  }

  filterCoaches(): void {
    const q = this.coachSearch.toLowerCase().trim();
    if (!q) {
      this.coaches = this.allCoaches;
    } else {
      this.coaches = this.allCoaches.filter(c =>
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.certifications || '').toLowerCase().includes(q) ||
        (c.bio || '').toLowerCase().includes(q)
      );
    }
  }

  getCoachInitials(c: CoachResponse): string {
    const parts = c.displayName?.split(' ') || [];
    return parts.map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  deleteCoach(c: CoachResponse): void {
    if (!confirm(`Supprimer le coach "${c.displayName}" ?`)) return;
    this.coachService.delete(c.id).subscribe({
      next: () => this.loadCoaches()
    });
  }

  /* ── coach modal ── */
  openCoachModal(): void {
    this.showCoachModal = true;
    this.editingCoachId = null;
    this.coachModalError = '';
    this.coachModalSuccess = '';
    this.newCoach = { displayName: '', username: '', phone: '', bio: '', certifications: '', active: true };
  }

  editCoach(c: CoachResponse): void {
    this.showCoachModal = true;
    this.editingCoachId = c.id;
    this.coachModalError = '';
    this.coachModalSuccess = '';
    this.newCoach = {
      displayName: c.displayName || '',
      username: '',
      phone: c.phone || '',
      bio: c.bio || '',
      certifications: c.certifications || '',
      active: c.active !== false
    };
  }

  closeCoachModal(): void {
    this.showCoachModal = false;
  }

  onCoachModalOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-over')) {
      this.closeCoachModal();
    }
  }

  submitNewCoach(): void {
    if (this.editingCoachId) {
      this.submitEditCoach();
      return;
    }
    if (!this.newCoach.displayName || !this.newCoach.username) {
      this.coachModalError = 'Veuillez remplir le nom d\'affichage et le nom d\'utilisateur.';
      return;
    }
    this.coachModalLoading = true;
    this.coachModalError = '';
    this.coachModalSuccess = '';

    const password = this.newCoach.username + '123';

    this.auth.register(this.newCoach.username, password, 'ROLE_COACH').pipe(
      switchMap((registerRes) => {
        const userId = registerRes?.userId;
        if (!userId) throw new Error('No userId returned from registration');
        return this.coachService.create({
          userId,
          displayName: this.newCoach.displayName,
          phone: this.newCoach.phone || null,
          bio: this.newCoach.bio || null,
          certifications: this.newCoach.certifications || null
        });
      })
    ).subscribe({
      next: () => {
        this.coachModalLoading = false;
        this.coachModalSuccess = 'Coach enregistré avec succès !';
        this.loadCoaches();
        setTimeout(() => this.closeCoachModal(), 1500);
      },
      error: (err) => {
        this.coachModalLoading = false;
        this.coachModalError = err?.error?.message || 'Erreur lors de l\'enregistrement du coach.';
      }
    });
  }

  submitEditCoach(): void {
    if (!this.newCoach.displayName) {
      this.coachModalError = 'Le nom d\'affichage est obligatoire.';
      return;
    }
    this.coachModalLoading = true;
    this.coachModalError = '';
    this.coachModalSuccess = '';

    this.coachService.update(this.editingCoachId!, {
      displayName: this.newCoach.displayName,
      phone: this.newCoach.phone || null,
      bio: this.newCoach.bio || null,
      certifications: this.newCoach.certifications || null,
      active: this.newCoach.active
    }).subscribe({
      next: () => {
        this.coachModalLoading = false;
        this.coachModalSuccess = 'Coach modifié avec succès !';
        this.loadCoaches();
        setTimeout(() => this.closeCoachModal(), 1500);
      },
      error: (err) => {
        this.coachModalLoading = false;
        this.coachModalError = err?.error?.message || 'Erreur lors de la modification du coach.';
      }
    });
  }

  /* ════════════ PLANNING: COURSES ════════════ */
  loadCourses(): void {
    this.courseService.list().subscribe({
      next: data => { this.courses = data; this.totalCourses = data.length; }
    });
  }

  openCourseModal(): void {
    this.editingCourseId = null;
    this.courseModalError = '';
    this.courseModalSuccess = '';
    this.newCourse = { name: '', description: '', durationMinutes: 60, capacity: 20, active: true, photoUrl: '' };
    this.showCourseModal = true;
  }

  editCourse(c: CourseResponse): void {
    this.editingCourseId = c.id;
    this.courseModalError = '';
    this.courseModalSuccess = '';
    this.newCourse = {
      name: c.name || '',
      description: c.description || '',
      durationMinutes: c.durationMinutes || 60,
      capacity: c.capacity || 20,
      active: c.active !== false,
      photoUrl: c.photoUrl || ''
    };
    this.showCourseModal = true;
  }

  closeCourseModal(): void { this.showCourseModal = false; }

  onCourseModalOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-over')) this.closeCourseModal();
  }

  onCourseFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) this.uploadCoursePhoto(input.files[0]);
  }

  onCourseFileDrop(event: DragEvent): void {
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadCoursePhoto(file);
  }

  private uploadCoursePhoto(file: File): void {
    this.coursePhotoUploading = true;
    const fd = new FormData();
    fd.append('file', file);
    this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, fd).subscribe({
      next: res => {
        this.newCourse.photoUrl = res.url;
        this.coursePhotoUploading = false;
      },
      error: () => {
        this.courseModalError = 'Erreur lors de l\'upload de la photo.';
        this.coursePhotoUploading = false;
      }
    });
  }

  getCoursePhotoFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiHost}${url}`;
  }

  submitCourse(): void {
    if (!this.newCourse.name) { this.courseModalError = 'Le nom du cours est obligatoire.'; return; }
    this.courseModalLoading = true;
    this.courseModalError = '';
    this.courseModalSuccess = '';

    const req = {
      name: this.newCourse.name,
      description: this.newCourse.description || null,
      durationMinutes: this.newCourse.durationMinutes,
      capacity: this.newCourse.capacity,
      active: this.newCourse.active,
      photoUrl: this.newCourse.photoUrl || null
    };

    const obs = this.editingCourseId
      ? this.courseService.update(this.editingCourseId, req)
      : this.courseService.create(req);

    obs.subscribe({
      next: () => {
        this.courseModalLoading = false;
        this.courseModalSuccess = this.editingCourseId ? 'Cours modifié !' : 'Cours créé !';
        this.loadCourses();
        setTimeout(() => this.closeCourseModal(), 1200);
      },
      error: err => {
        this.courseModalLoading = false;
        this.courseModalError = err?.error?.message || 'Erreur.';
      }
    });
  }

  deleteCourse(c: CourseResponse): void {
    if (!confirm(`Supprimer le cours "${c.name}" ?`)) return;
    this.courseService.delete(c.id).subscribe({ next: () => this.loadCourses() });
  }

  /* ════════════ PLANNING: SCHEDULES ════════════ */
  loadSchedules(): void {
    this.scheduleService.listAll().subscribe({
      next: data => { this.schedules = data; this.totalSchedules = data.length; }
    });
  }

  getCourseName(courseId: number): string {
    return this.courses.find(c => c.id === courseId)?.name || '—';
  }

  getCoachName(coachId: number | null | undefined): string {
    if (!coachId) return 'Non assigné';
    return this.allCoaches.find(c => c.id === coachId)?.displayName || '—';
  }

  formatTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  isScheduleExpired(endTime: string): boolean {
    if (!endTime) return false;
    return new Date(endTime).getTime() < Date.now();
  }

  getScheduleStatus(s: any): string {
    if (this.isScheduleExpired(s.endTime)) return 'Inactif';
    return s.active ? 'Actif' : 'En attente coach';
  }

  openScheduleModal(): void {
    this.editingScheduleId = null;
    this.scheduleModalError = '';
    this.scheduleModalSuccess = '';
    this.newSchedule = { courseId: this.courses[0]?.id || 0, coachId: null, room: '', startTime: '', endTime: '', capacity: 20, active: false };
    this.showScheduleModal = true;
  }

  editSchedule(s: CourseScheduleResponse): void {
    this.editingScheduleId = s.id;
    this.scheduleModalError = '';
    this.scheduleModalSuccess = '';
    const toLocal = (iso: string) => {
      if (!iso) return '';
      return iso.substring(0, 16); // "YYYY-MM-DDTHH:mm"
    };
    this.newSchedule = {
      courseId: s.courseId,
      coachId: s.coachId || null,
      room: s.room || '',
      startTime: toLocal(s.startTime),
      endTime: toLocal(s.endTime),
      capacity: s.capacity || 20,
      active: s.active !== false
    };
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void { this.showScheduleModal = false; }

  onScheduleModalOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-over')) this.closeScheduleModal();
  }

  submitSchedule(): void {
    if (!this.newSchedule.courseId || !this.newSchedule.startTime || !this.newSchedule.endTime) {
      this.scheduleModalError = 'Cours, heure début et heure fin sont obligatoires.'; return;
    }
    this.scheduleModalLoading = true;
    this.scheduleModalError = '';
    this.scheduleModalSuccess = '';

    const pad = (v: string) => v && v.length === 16 ? v + ':00' : v; // "YYYY-MM-DDTHH:mm" → add seconds
    const req = {
      courseId: this.newSchedule.courseId,
      coachId: this.newSchedule.coachId || null,
      room: this.newSchedule.room || null,
      startTime: pad(this.newSchedule.startTime),
      endTime: pad(this.newSchedule.endTime),
      capacity: this.newSchedule.capacity,
      active: this.editingScheduleId ? this.newSchedule.active : false
    };

    const obs = this.editingScheduleId
      ? this.scheduleService.update(this.editingScheduleId, req)
      : this.scheduleService.create(req);

    obs.subscribe({
      next: () => {
        this.scheduleModalLoading = false;
        this.scheduleModalSuccess = this.editingScheduleId ? 'Séance modifiée !' : 'Séance créée en attente de confirmation coach !';
        this.loadSchedules();
        setTimeout(() => this.closeScheduleModal(), 1200);
      },
      error: err => {
        this.scheduleModalLoading = false;
        this.scheduleModalError = err?.error?.message || 'Erreur.';
      }
    });
  }

  deleteSchedule(s: CourseScheduleResponse): void {
    if (!confirm('Supprimer cette séance ?')) return;
    this.scheduleService.delete(s.id).subscribe({ next: () => this.loadSchedules() });
  }

  /* ════════════ SUBSCRIPTION PLANS ════════════ */
  loadPlans(): void {
    this.planService.list().subscribe({
      next: data => {
        this.plans = data;
        this.totalPlans = data.length;
        this.activePlans = data.filter(p => p.active).length;
      }
    });
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  openPlanModal(): void {
    this.editingPlanId = null;
    this.planModalError = '';
    this.planModalSuccess = '';
    this.newPlan = { name: '', durationDays: 30, priceCents: 0, includesClasses: false, description: '', active: true };
    this.showPlanModal = true;
  }

  editPlan(p: PlanResponse): void {
    this.editingPlanId = p.id;
    this.planModalError = '';
    this.planModalSuccess = '';
    this.newPlan = {
      name: p.name || '',
      durationDays: p.durationDays || 30,
      priceCents: p.priceCents || 0,
      includesClasses: p.includesClasses || false,
      description: p.description || '',
      active: p.active !== false
    };
    this.showPlanModal = true;
  }

  closePlanModal(): void { this.showPlanModal = false; }

  onPlanModalOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-over')) this.closePlanModal();
  }

  submitPlan(): void {
    if (!this.newPlan.name) { this.planModalError = 'Le nom du plan est obligatoire.'; return; }
    if (this.newPlan.durationDays < 1) { this.planModalError = 'La durée doit être d\'au moins 1 jour.'; return; }
    if (this.newPlan.priceCents < 0) { this.planModalError = 'Le prix ne peut pas être négatif.'; return; }
    this.planModalLoading = true;
    this.planModalError = '';
    this.planModalSuccess = '';

    if (this.editingPlanId) {
      this.planService.update(this.editingPlanId, {
        name: this.newPlan.name,
        durationDays: this.newPlan.durationDays,
        priceCents: this.newPlan.priceCents,
        includesClasses: this.newPlan.includesClasses,
        description: this.newPlan.description || null,
        active: this.newPlan.active
      }).subscribe({
        next: () => {
          this.planModalLoading = false;
          this.planModalSuccess = 'Plan modifié avec succès !';
          this.loadPlans();
          setTimeout(() => this.closePlanModal(), 1200);
        },
        error: err => {
          this.planModalLoading = false;
          this.planModalError = err?.error?.message || 'Erreur lors de la modification.';
        }
      });
    } else {
      this.planService.create({
        name: this.newPlan.name,
        durationDays: this.newPlan.durationDays,
        priceCents: this.newPlan.priceCents,
        includesClasses: this.newPlan.includesClasses,
        description: this.newPlan.description || null
      }).subscribe({
        next: () => {
          this.planModalLoading = false;
          this.planModalSuccess = 'Plan créé avec succès !';
          this.loadPlans();
          setTimeout(() => this.closePlanModal(), 1200);
        },
        error: err => {
          this.planModalLoading = false;
          this.planModalError = err?.error?.message || 'Erreur lors de la création.';
        }
      });
    }
  }

  deletePlan(p: PlanResponse): void {
    if (!confirm(`Supprimer le plan "${p.name}" ?`)) return;
    this.planService.delete(p.id).subscribe({ next: () => this.loadPlans() });
  }

  /* ════════════ FINANCES: PAYMENTS & SUBSCRIPTIONS ════════════ */
  loadPayments(): void {
    this.paymentAdminService.listAll().subscribe({
      next: data => {
        this.allPayments = data;
        this.totalPayments = data.length;
        this.totalRevenue = data
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + (p.amountCents || 0), 0);
      }
    });
  }

  loadSubscriptions(): void {
    this.subscriptionService.listAll().subscribe({
      next: data => {
        this.allSubscriptions = data;
        this.totalSubscriptions = data.length;
        this.activeSubscriptions = data.filter(s => s.status === 'ACTIVE').length;
      }
    });
  }

  get monthCompletedPayments(): PaymentResponse[] {
    const now = new Date();
    return this.allPayments
      .filter(p => p.status === 'COMPLETED' && this.isSameMonth(new Date(p.paymentDate), now))
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  get previousMonthCompletedPayments(): PaymentResponse[] {
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    return this.allPayments
      .filter(p => p.status === 'COMPLETED' && this.isSameMonth(new Date(p.paymentDate), prev));
  }

  get monthRevenueCents(): number {
    return this.monthCompletedPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
  }

  get previousMonthRevenueCents(): number {
    return this.previousMonthCompletedPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
  }

  get monthRevenueDeltaPct(): number | null {
    const previous = this.previousMonthRevenueCents;
    if (!previous) return null;
    return ((this.monthRevenueCents - previous) / previous) * 100;
  }

  get expiringSoonSubscriptions(): SubscriptionResponse[] {
    const now = new Date();
    const in7days = new Date();
    in7days.setDate(in7days.getDate() + 7);

    return this.allSubscriptions
      .filter(s => s.status === 'ACTIVE')
      .filter(s => {
        const end = new Date(s.endDate);
        return end >= now && end <= in7days;
      })
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 6);
  }

  get upcomingSchedulesDashboard(): CourseScheduleResponse[] {
    const now = new Date();
    return this.schedules
      .filter(s => (s.active ?? true) && new Date(s.startTime).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 6);
  }

  daysUntil(iso: string): number {
    const now = new Date();
    const target = new Date(iso);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private isSameMonth(date: Date, reference: Date): boolean {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
  }

  formatPaymentDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  formatSubDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getPlanNameById(planId: number): string {
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.name : 'Plan indisponible';
  }

  getMemberNameById(memberId: number): string {
    const member = this.members.find(m => m.id === memberId);
    return member ? (member.firstName + ' ' + member.lastName) : 'Membre indisponible';
  }

  private initializeSettingsForms(): void {
    const payload = this.auth.getPayload();
    const storedDisplayName = localStorage.getItem('adminProfile.displayName');
    const storedEmail = localStorage.getItem('adminProfile.email');
    const storedPhone = localStorage.getItem('adminProfile.phone');

    this.profileForm.displayName = storedDisplayName || this.adminName || payload?.sub || '';
    this.profileForm.email = storedEmail || payload?.email || '';
    this.profileForm.phone = storedPhone || '';
  }

  saveProfileSettings(): void {
    this.profileError = '';
    this.profileSuccess = '';

    if (!this.profileForm.displayName.trim()) {
      this.profileError = 'Le nom d\'affichage est obligatoire.';
      return;
    }

    this.profileLoading = true;

    localStorage.setItem('adminProfile.displayName', this.profileForm.displayName.trim());
    localStorage.setItem('adminProfile.email', this.profileForm.email.trim());
    localStorage.setItem('adminProfile.phone', this.profileForm.phone.trim());

    this.adminName = this.profileForm.displayName.trim();
    this.adminInitial = this.adminName.charAt(0).toUpperCase();

    this.profileLoading = false;
    this.profileSuccess = 'Profil mis à jour avec succès.';
  }

  submitPasswordChange(): void {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.passwordError = 'Veuillez remplir tous les champs du mot de passe.';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'La confirmation ne correspond pas au nouveau mot de passe.';
      return;
    }

    this.passwordLoading = true;
    this.auth.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.message || 'Erreur lors du changement du mot de passe.';
      }
    });
  }
}
