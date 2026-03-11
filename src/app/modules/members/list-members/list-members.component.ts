import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { MemberResponse, PagedResponse } from '../../../models/member.model';
import { AuthService } from '../../../services/auth.service';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-list-members',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './list-members.component.html',
  styleUrls: ['./list-members.component.css']
})
export class ListMembersComponent implements OnInit {
  displayedColumns = ['id', 'firstName', 'lastName', 'phone', 'active', 'actions'];
  members: MemberResponse[] = [];
  total = 0;
  page = 0;
  size = 10;
  search = '';

  constructor(
    private memberService: MemberService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.memberService.list(this.search || undefined, this.page, this.size).subscribe({
      next: res => {
        this.members = res.items;
        this.total = res.total;
      },
      error: err => console.error('Failed to load members', err)
    });
  }

  onSearch() {
    this.page = 0;
    this.load();
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    this.memberService.delete(id).subscribe({
      next: () => this.load(),
      error: err => console.error('Delete failed', err)
    });
  }
}
