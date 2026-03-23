import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CourseService } from '../../core/services/course.service';
import { CourseScheduleService } from '../../core/services/course-schedule.service';
import { CourseResponse, CourseScheduleResponse } from '../../models/course.model';
import { CoachService } from '../../core/services/coach.service';
import { CoachResponse } from '../../models/coach.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './programmes.component.html',
  styleUrl: './programmes.component.css'
})
export class ProgrammesComponent implements OnInit {
  private readonly apiHost = environment.apiUrl.startsWith('http')
    ? environment.apiUrl.replace(/\/api$/, '')
    : window.location.origin;

  activeTab: 'courses' | 'schedules' = 'courses';
  loading = true;

  courses: CourseResponse[] = [];
  schedules: CourseScheduleResponse[] = [];
  coaches: CoachResponse[] = [];

  // filtered
  filteredCourses: CourseResponse[] = [];
  filteredSchedules: CourseScheduleResponse[] = [];

  // pagination
  coursePage = 1;
  schedulePage = 1;
  pageSize = 6;

  // search
  searchQuery = '';

  // filters
  durationFilter: 'all' | 'short' | 'medium' | 'long' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private courseService: CourseService,
    private scheduleService: CourseScheduleService,
    private coachService: CoachService
  ) {}

  ngOnInit(): void {
    forkJoin({
      courses: this.courseService.list(),
      schedules: this.scheduleService.listAll(),
      coaches: this.coachService.listActive()
    }).subscribe({
      next: ({ courses, schedules, coaches }) => {
        this.courses = courses;
        this.schedules = schedules;
        this.coaches = coaches;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    let fc = [...this.courses];
    let fs = [...this.schedules];
    const q = this.searchQuery.toLowerCase().trim();

    // search
    if (q) {
      fc = fc.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
      const matchedCourseIds = new Set(fc.map(c => c.id));
      fs = fs.filter(s =>
        matchedCourseIds.has(s.courseId) ||
        (this.getCoachName(s.coachId)).toLowerCase().includes(q) ||
        (s.room || '').toLowerCase().includes(q)
      );
    }

    // status
    if (this.statusFilter === 'active') {
      fc = fc.filter(c => c.active !== false);
      fs = fs.filter(s => s.active !== false);
    } else if (this.statusFilter === 'inactive') {
      fc = fc.filter(c => c.active === false);
      fs = fs.filter(s => s.active === false);
    }

    // duration
    if (this.durationFilter !== 'all') {
      fc = fc.filter(c => {
        const d = c.durationMinutes || 0;
        if (this.durationFilter === 'short') return d <= 30;
        if (this.durationFilter === 'medium') return d > 30 && d <= 60;
        return d > 60;
      });
    }

    this.filteredCourses = fc;
    this.filteredSchedules = fs;
    this.coursePage = 1;
    this.schedulePage = 1;
  }

  get pagedCourses(): CourseResponse[] {
    const start = (this.coursePage - 1) * this.pageSize;
    return this.filteredCourses.slice(start, start + this.pageSize);
  }

  get totalCoursePages(): number {
    return Math.ceil(this.filteredCourses.length / this.pageSize) || 1;
  }

  get pagedSchedules(): CourseScheduleResponse[] {
    const start = (this.schedulePage - 1) * this.pageSize;
    return this.filteredSchedules.slice(start, start + this.pageSize);
  }

  get totalSchedulePages(): number {
    return Math.ceil(this.filteredSchedules.length / this.pageSize) || 1;
  }

  getCoursePages(): number[] {
    return Array.from({ length: this.totalCoursePages }, (_, i) => i + 1);
  }

  getSchedulePages(): number[] {
    return Array.from({ length: this.totalSchedulePages }, (_, i) => i + 1);
  }

  goToCoursePage(p: number): void {
    if (p >= 1 && p <= this.totalCoursePages) this.coursePage = p;
  }

  goToSchedulePage(p: number): void {
    if (p >= 1 && p <= this.totalSchedulePages) this.schedulePage = p;
  }

  setDuration(val: 'all' | 'short' | 'medium' | 'long'): void {
    this.durationFilter = val;
    this.applyFilters();
  }

  setStatus(val: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = val;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  getCoachName(coachId: number | null | undefined): string {
    if (!coachId) return 'Non assigné';
    return this.coaches.find(c => c.id === coachId)?.displayName || '—';
  }

  getCourseName(courseId: number): string {
    return this.courses.find(c => c.id === courseId)?.name || '—';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

  getPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiHost}${url}`;
  }

  get activeCourseCount(): number {
    return this.courses.filter(c => c.active !== false).length;
  }

  get upcomingSchedules(): number {
    const now = new Date();
    return this.schedules.filter(s => new Date(s.startTime) > now && s.active !== false).length;
  }
}
