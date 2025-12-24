import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading = true;
    this.error = null;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        // fetch current user and redirect to admin dashboard
        this.auth.fetchCurrentUser().subscribe({ next: () => this.router.navigate(['/admin/dashboard']) });
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Login failed';
        this.loading = false;
      }
    });
  }
}
