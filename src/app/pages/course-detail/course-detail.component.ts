import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CourseService } from '../../core/services/course.service';
import { CourseScheduleService } from '../../core/services/course-schedule.service';
import { CoachService } from '../../core/services/coach.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../services/auth.service';
import { CourseResponse, CourseScheduleResponse } from '../../models/course.model';
import { CoachResponse } from '../../models/coach.model';
import { BookingResponse } from '../../models/booking.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit {
  private readonly apiHost = environment.apiUrl.startsWith('http')
    ? environment.apiUrl.replace(/\/api$/, '')
    : window.location.origin;

  course: CourseResponse | null = null;
  schedules: CourseScheduleResponse[] = [];
  coaches: CoachResponse[] = [];
  loading = true;
  notFound = false;

  // Enrollment state
  myBookings: BookingResponse[] = [];
  enrollingScheduleId: number | null = null; // schedule currently being enrolled
  cancellingBookingId: number | null = null;
  enrollMessage: string = '';
  enrollMessageType: 'success' | 'error' | 'info' = 'info';
  bookedCounts: Record<number, number> = {}; // scheduleId → confirmed count

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private scheduleService: CourseScheduleService,
    private coachService: CoachService,
    private bookingService: BookingService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    forkJoin({
      course: this.courseService.getById(id),
      schedules: this.scheduleService.listByCourse(id),
      coaches: this.coachService.listActive()
    }).subscribe({
      next: ({ course, schedules, coaches }) => {
        this.course = course;
        this.schedules = schedules.filter(s => s.active !== false);
        this.coaches = coaches;
        this.loading = false;

        // Load booking counts for each schedule
        this.loadBookingCounts();

        // Load my bookings if logged in as member
        if (this.isMember) {
          this.loadMyBookings();
        }
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  get isMember(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasRole('ROLE_MEMBER');
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  loadMyBookings(): void {
    this.bookingService.myBookings().subscribe({
      next: (bookings) => { this.myBookings = bookings; },
      error: () => { this.myBookings = []; }
    });
  }

  loadBookingCounts(): void {
    for (const s of this.schedules) {
      this.bookingService.getConfirmedCount(s.id).subscribe({
        next: (res) => { this.bookedCounts[s.id] = res.count; },
        error: () => { this.bookedCounts[s.id] = 0; }
      });
    }
  }

  getRemainingCapacity(schedule: CourseScheduleResponse): number | null {
    const cap = schedule.capacity ?? this.course?.capacity;
    if (cap == null) return null;
    const booked = this.bookedCounts[schedule.id] ?? 0;
    return Math.max(0, cap - booked);
  }

  getBookingForSchedule(scheduleId: number): BookingResponse | null {
    return this.myBookings.find(
      b => b.scheduleId === scheduleId && b.status !== 'CANCELLED'
    ) || null;
  }

  enroll(scheduleId: number): void {
    if (this.enrollingScheduleId) return;
    this.enrollingScheduleId = scheduleId;
    this.enrollMessage = '';

    this.bookingService.enrollMe(scheduleId).subscribe({
      next: (res) => {
        this.enrollingScheduleId = null;
        if (res.status === 'WAITING') {
          this.showMessage('Séance complète — vous avez été ajouté à la liste d\'attente.', 'info');
        } else {
          this.showMessage('Inscription confirmée ! 🎉', 'success');
          // Update local count
          this.bookedCounts[scheduleId] = (this.bookedCounts[scheduleId] ?? 0) + 1;
        }
        this.loadMyBookings();
      },
      error: (err) => {
        this.enrollingScheduleId = null;
        const msg = err?.error?.message || err?.error || 'Erreur lors de l\'inscription.';
        this.showMessage(typeof msg === 'string' ? msg : 'Erreur lors de l\'inscription.', 'error');
      }
    });
  }

  cancelBooking(bookingId: number): void {
    if (this.cancellingBookingId) return;
    this.cancellingBookingId = bookingId;
    this.enrollMessage = '';

    this.bookingService.cancel(bookingId).subscribe({
      next: () => {
        this.cancellingBookingId = null;
        this.showMessage('Inscription annulée.', 'info');
        this.loadMyBookings();
        this.loadBookingCounts(); // refresh counts after cancel
      },
      error: () => {
        this.cancellingBookingId = null;
        this.showMessage('Erreur lors de l\'annulation.', 'error');
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info'): void {
    this.enrollMessage = msg;
    this.enrollMessageType = type;
    setTimeout(() => { this.enrollMessage = ''; }, 5000);
  }

  getPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiHost}${url}`;
  }

  getCourseIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('cross') || n.includes('hiit') || n.includes('cardio')) return '🔥';
    if (n.includes('yoga') || n.includes('pilates') || n.includes('stretch')) return '🧘';
    if (n.includes('box') || n.includes('combat') || n.includes('mma')) return '🥊';
    if (n.includes('spin') || n.includes('cycl') || n.includes('vélo')) return '🚴';
    if (n.includes('zumba') || n.includes('danse') || n.includes('dance')) return '💃';
    if (n.includes('muscu') || n.includes('force') || n.includes('weight')) return '🏋️';
    if (n.includes('natation') || n.includes('swim') || n.includes('aqua')) return '🏊';
    return '💪';
  }

  getCoachName(coachId: number | null | undefined): string {
    if (!coachId) return 'Non assigné';
    return this.coaches.find(c => c.id === coachId)?.displayName || '—';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getDurationLabel(min: number | null | undefined): string {
    if (!min) return '—';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  }

  isScheduleExpired(s: CourseScheduleResponse): boolean {
    return !!s.endTime && new Date(s.endTime).getTime() < Date.now();
  }

  goBack(): void {
    this.router.navigate(['/programmes']);
  }
}
