import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        if (this.auth.hasRole('ROLE_ADMIN')) this.router.navigate(['/admin']);
        else if (this.auth.hasRole('ROLE_COACH')) this.router.navigate(['/coach']);
        else if (this.auth.hasRole('ROLE_MEMBER')) this.router.navigate(['/members/me']);
        else this.router.navigate(['/']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nom d\'utilisateur ou mot de passe incorrect';
      }
    });
  }
}
