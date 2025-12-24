import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any[]) => { this.users = res; this.loading = false; },
      error: (err: any) => { this.error = err?.error?.detail || 'Failed to load users'; this.loading = false; }
    });
  }

  editUser(user: any) {
    this.router.navigate(['/admin/edit', user.id]);
  }

  deleteUser(user: any) {
    if (!confirm('Delete user ' + user.email + '?')) return;
    this.adminService.deleteUser(user.id).subscribe({ next: () => this.fetchUsers() });
  }
}
