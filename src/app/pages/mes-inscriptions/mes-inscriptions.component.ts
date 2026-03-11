import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { BookingService } from '../../core/services/booking.service';
import { CourseService } from '../../core/services/course.service';
import { CourseScheduleService } from '../../core/services/course-schedule.service';
import { CoachService } from '../../core/services/coach.service';
import { BookingResponse } from '../../models/booking.model';
import { CourseResponse, CourseScheduleResponse } from '../../models/course.model';
import { CoachResponse } from '../../models/coach.model';

interface EnrichedBooking {
  booking: BookingResponse;
  schedule: CourseScheduleResponse | null;
  course: CourseResponse | null;
  coachName: string;
}

@Component({
  selector: 'app-mes-inscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mes-inscriptions.component.html',
  styleUrls: ['./mes-inscriptions.component.css']
})
export class MesInscriptionsComponent implements OnInit {
  loading = true;
  enriched: EnrichedBooking[] = [];
  cancellingId: number | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // filter
  activeFilter: 'all' | 'confirmed' | 'waiting' | 'cancelled' = 'all';

  private courses: CourseResponse[] = [];
  private schedules: CourseScheduleResponse[] = [];
  private coaches: CoachResponse[] = [];

  constructor(
    private bookingService: BookingService,
    private courseService: CourseService,
    private scheduleService: CourseScheduleService,
    private coachService: CoachService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      bookings: this.bookingService.myBookings(),
      courses: this.courseService.list(),
      schedules: this.scheduleService.listAll(),
      coaches: this.coachService.listActive()
    }).subscribe({
      next: ({ bookings, courses, schedules, coaches }) => {
        this.courses = courses;
        this.schedules = schedules;
        this.coaches = coaches;
        this.enriched = bookings.map(b => this.enrich(b));
        // Sort: confirmed first, then waiting, then cancelled; within group newest first
        this.enriched.sort((a, b) => {
          const order: Record<string, number> = { CONFIRMED: 0, WAITING: 1, CANCELLED: 2 };
          const diff = (order[a.booking.status] ?? 3) - (order[b.booking.status] ?? 3);
          if (diff !== 0) return diff;
          return new Date(b.booking.createdAt || 0).getTime() - new Date(a.booking.createdAt || 0).getTime();
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private enrich(b: BookingResponse): EnrichedBooking {
    const schedule = this.schedules.find(s => s.id === b.scheduleId) || null;
    const course = schedule ? (this.courses.find(c => c.id === schedule.courseId) || null) : null;
    const coach = schedule?.coachId ? this.coaches.find(c => c.id === schedule.coachId) : null;
    return { booking: b, schedule, course, coachName: coach?.displayName || 'Non assigné' };
  }

  get filtered(): EnrichedBooking[] {
    if (this.activeFilter === 'all') return this.enriched;
    return this.enriched.filter(e => e.booking.status === this.activeFilter.toUpperCase());
  }

  get confirmedCount(): number {
    return this.enriched.filter(e => e.booking.status === 'CONFIRMED').length;
  }
  get waitingCount(): number {
    return this.enriched.filter(e => e.booking.status === 'WAITING').length;
  }
  get cancelledCount(): number {
    return this.enriched.filter(e => e.booking.status === 'CANCELLED').length;
  }

  cancelBooking(id: number | null): void {
    if (!id || this.cancellingId) return;
    this.cancellingId = id;
    this.message = '';
    this.bookingService.cancel(id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.showMsg('Inscription annulée avec succès.', 'success');
        this.loadAll();
      },
      error: () => {
        this.cancellingId = null;
        this.showMsg('Erreur lors de l\'annulation.', 'error');
      }
    });
  }

  private showMsg(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 4000);
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return '✅ Confirmée';
      case 'WAITING': return '⏳ En attente';
      case 'CANCELLED': return '❌ Annulée';
      default: return status;
    }
  }

  isScheduleExpired(item: EnrichedBooking): boolean {
    return !!item.schedule?.endTime && new Date(item.schedule.endTime).getTime() < Date.now();
  }

  getDisplayStatus(item: EnrichedBooking): string {
    if (this.isScheduleExpired(item) && item.booking.status !== 'CANCELLED') return '⌛ Expirée';
    return this.getStatusLabel(item.booking.status);
  }

  get expiredCount(): number {
    return this.enriched.filter(e => this.isScheduleExpired(e) && e.booking.status !== 'CANCELLED').length;
  }
}
