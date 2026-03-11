import { Component, AfterViewInit, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { CourseResponse } from '../../models/course.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;
  courses: CourseResponse[] = [];

  constructor(
    public auth: AuthService,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    document.documentElement.classList.add('no-scrollbar');
    this.courseService.list().subscribe({
      next: data => this.courses = data.filter(c => c.active !== false)
    });
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => this.observer!.observe(el));
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    document.documentElement.classList.remove('no-scrollbar');
  }

  @HostListener('window:scroll')
  onScroll() {
    const nav = document.getElementById('navbar');
    if (nav) {
      nav.style.borderBottomColor = window.scrollY > 40
        ? 'rgba(249,115,22,0.15)'
        : 'rgba(255,255,255,0.08)';
    }
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  getPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
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
}