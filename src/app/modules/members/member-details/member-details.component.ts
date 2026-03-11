import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../../core/services/member.service';
import { MemberResponse } from '../../../models/member.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-member-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-details.component.html',
  styleUrls: ['./member-details.component.css']
})
export class MemberDetailsComponent implements OnInit {
  member?: MemberResponse;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MemberService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: m => this.member = m,
      error: err => {
        console.error(err);
        this.router.navigate(['/members']);
      }
    });
  }

  onDelete() {
    if (!this.member) return;
    if (!confirm('Are you sure you want to delete this member?')) return;
    this.svc.delete(this.member.id).subscribe({
      next: () => this.router.navigate(['/members']),
      error: err => console.error(err)
    });
  }
}
