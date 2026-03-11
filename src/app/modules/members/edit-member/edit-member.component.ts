import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { MemberResponse, MemberUpdateRequest } from '../../../models/member.model';

@Component({
  selector: 'app-edit-member',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-member.component.html',
  styleUrls: ['./edit-member.component.css']
})
export class EditMemberComponent implements OnInit {
  member?: MemberResponse;
  loading = false;
  errorMsg = '';
  successMsg = '';
  private memberId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MemberService
  ) {}

  ngOnInit() {
    this.memberId = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(this.memberId).subscribe({
      next: m => this.member = m,
      error: () => this.router.navigate(['/members'])
    });
  }

  onSubmit() {
    if (!this.member) return;
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const update: MemberUpdateRequest = {
      firstName: this.member.firstName,
      lastName: this.member.lastName,
      phone: this.member.phone,
      birthDate: this.member.birthDate,
      active: this.member.active
    };

    this.svc.update(this.memberId, update).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Membre mis à jour avec succès !';
        setTimeout(() => this.router.navigate(['/admin']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
